import json, time, uuid, hashlib
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agent import build_agent, run_agent_stream, _debug

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
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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
    body = await request.json()
    messages = body.get("messages", [])
    model = body.get("model", "mokart-agent")

    user_message = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    first_user = next((m["content"] for m in messages if m["role"] == "user"), "default")
    thread_id = f"ow_{hashlib.md5(first_user.encode()).hexdigest()[:10]}"

    _debug(f"📋 Query: {user_message[:80]}")

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
            async for kind, text in run_agent_stream(agent, user_message, thread_id):
                if kind == "status":
                    yield f"data: {chunk(status=text)}\n\n"
                else:
                    yield f"data: {chunk(content=text)}\n\n"

        except Exception as e:
            err = f"\n\n❌ Erreur: {e}"
            yield f"data: {chunk(err)}\n\n"

        yield f"data: {json.dumps({'id': msg_id, 'object': 'chat.completion.chunk', 'created': created, 'model': model, 'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
