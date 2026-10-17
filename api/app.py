from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from config.database import get_db
from auth.routes import router as auth_router
from sessions.routes import router as sessions_router
from circuits.routes import router as circuits_router
from users.routes import router as users_router, admin_router
from dashboard.routes import router as dashboard_router
from sqlalchemy.orm import Session
import asyncio
import os

# Create tables if not exists (although init.sql should handle it)
# Base.metadata.create_all(bind=engine)

DOCS_ENABLED = os.getenv("API_DOCS", "false").lower() in ("1", "true", "yes")

app = FastAPI(
    docs_url="/docs" if DOCS_ENABLED else None,
    redoc_url="/redoc" if DOCS_ENABLED else None,
    openapi_url="/openapi.json" if DOCS_ENABLED else None,
)

DEFAULT_ORIGINS = (
    "http://localhost:8000,http://localhost:8080,http://localhost:3000,"
    "https://app.mokart.fr,https://app-dev.mokart.fr,https://app.novationlabs.fr"
)
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()]

# Configuration CORS AVANT les routes
app.add_middleware(
    CORSMiddleware,
    # Autorise tout pour éviter les problèmes en dev (téléphone, IP locale, etc)
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Cache-Control", "no-store")
    return response

# Configuration du timeout global
@app.middleware("http")
async def add_timeout_middleware(request, call_next):
    try:
        # Timeout de 120 secondes pour les requêtes (augmenté pour le calcul de trajectoire)
        return await asyncio.wait_for(call_next(request), timeout=120.0)
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=408,
            content={"detail": "Request timeout - l'opération a pris trop de temps"}
        )

# Inclure les routes
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(circuits_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(dashboard_router)

@app.get("/")
async def main():
    return {"message": "Mokart API", "status": "running"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Simple query to check DB connection
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "error", "database": "unavailable"})
