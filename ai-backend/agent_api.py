import json
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse

from agent import build_agent, run_agent_stream, to_langchain_messages, _debug

MAX_BODY_BYTES = 64 * 1024

# =============================================================================
# CONFIG
# =============================================================================

agent = None


# =============================================================================
# LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent

    _debug("🚀 Building agent...")
    agent = await build_agent()
    _debug("✅ Agent ready")
    yield


# =============================================================================
# APP
# =============================================================================

app = FastAPI(
    lifespan=lifespan,
    title="Mokart Agent API",
    description="Mokart Agent — Assistant IA conversationnel",
)


# =============================================================================
# ROUTES
# =============================================================================

@app.get("/health")
async def health():
    return {"status": "ok", "agent": agent is not None}


@app.get("/v1/models")
async def models():
    return {
        "object": "list",
        "data": [{
            "id": "mokart-agent",
            "object": "model",
            "created": 1700000000,
            "owned_by": "mokart",
        }]
    }


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    raw = await request.body()
    if len(raw) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Requête trop grande")
    try:
        body = json.loads(raw)
        history = to_langchain_messages(body.get("messages", []))
    except (ValueError, AttributeError) as e:
        raise HTTPException(status_code=400, detail=f"Requête invalide : {e}")
    model = "mokart-agent"

    _debug(f"📋 Query: {len(history)} messages")

    async def generate():
        msg_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        created = int(time.time())

        def chunk(content: str = "", status: str = "", finish_reason=None):
            delta = {}
            if content:
                delta["content"] = content
            if status:
                delta["status"] = status
            return json.dumps({
                "id": msg_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [{"index": 0, "delta": delta, "finish_reason": finish_reason}],
            })

        try:
            async for kind, text in run_agent_stream(agent, history):
                if kind == "status":
                    yield f"data: {chunk(status=text)}\n\n"
                else:
                    yield f"data: {chunk(content=text)}\n\n"

        except Exception as e:
            _debug(f"❌ Erreur: {e}")
            yield f"data: {chunk('L agent a rencontré une erreur.')}\n\n"

        yield f"data: {json.dumps({'id': msg_id, 'object': 'chat.completion.chunk', 'created': created, 'model': model, 'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
