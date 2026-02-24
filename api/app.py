from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from config.database import get_db, engine, Base
from auth.routes import router as auth_router
from sessions.routes import router as sessions_router
from sqlalchemy.orm import Session

# Create tables if not exists (although init.sql should handle it)
# Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    # Autorise tout pour éviter les problèmes en dev (téléphone, IP locale, etc)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(auth_router)
app.include_router(sessions_router)

@app.get("/")
async def main():
    return {"message": "Mokart API", "status": "running"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Simple query to check DB connection
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
