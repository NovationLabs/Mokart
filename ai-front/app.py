import httpx, os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

load_dotenv()

# =============================================================================
# CONFIG
# =============================================================================

AGENT_API_URL = os.getenv("AGENT_API_URL")
LLM_MODEL = os.getenv("LLM_MODEL")

# =============================================================================
# APP
# =============================================================================

app = FastAPI(title="Mokart Agent Front")
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
    body = await request.json()

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
