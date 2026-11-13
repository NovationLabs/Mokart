import httpx
import json
import os
import threading
import time
from collections import defaultdict, deque
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

load_dotenv()

# =============================================================================
# CONFIG
# =============================================================================

AGENT_API_URL = os.getenv("AGENT_API_URL")
LLM_MODEL = os.getenv("LLM_MODEL")
MAX_BODY_BYTES = 64 * 1024
RATE_MAX = int(os.getenv("CHAT_RATE_MAX", "20"))
RATE_WINDOW_S = int(os.getenv("CHAT_RATE_WINDOW_S", "600"))

_hits = defaultdict(deque)
_lock = threading.Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limited(key: str) -> bool:
    now = time.monotonic()
    with _lock:
        hits = _hits[key]
        while hits and now - hits[0] > RATE_WINDOW_S:
            hits.popleft()
        if len(hits) >= RATE_MAX:
            return True
        hits.append(now)
        return False

# =============================================================================
# APP
# =============================================================================

app = FastAPI(title="Mokart Agent Front", docs_url=None, redoc_url=None, openapi_url=None)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# =============================================================================
# ROUTES
# =============================================================================

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse(request, "chat.html", {
        "llm_model": LLM_MODEL,
    })


@app.post("/api/chat")
async def chat(request: Request):
    if _rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Trop de messages, réessaie dans quelques minutes")
    raw = await request.body()
    if len(raw) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Message trop long")
    try:
        payload = json.loads(raw)
    except ValueError:
        raise HTTPException(status_code=400, detail="Requête invalide")
    if not isinstance(payload, dict) or not isinstance(payload.get("messages"), list):
        raise HTTPException(status_code=400, detail="Requête invalide")
    body = {"messages": payload["messages"]}

    async def stream():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{AGENT_API_URL}/v1/chat/completions",
                json=body,
                timeout=httpx.Timeout(300.0),
            ) as response:
                if response.status_code != 200:
                    yield f'data: {{"error": "Agent error {response.status_code}"}}\n\n'
                    return
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
