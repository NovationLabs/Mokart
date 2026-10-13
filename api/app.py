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

# Create tables if not exists (although init.sql should handle it)
# Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuration CORS AVANT les routes
app.add_middleware(
    CORSMiddleware,
    # Autorise tout pour éviter les problèmes en dev (téléphone, IP locale, etc)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
