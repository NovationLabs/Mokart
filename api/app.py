from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from config.database import get_db, engine, Base
from auth.routes import router as auth_router
from sessions.routes import router as sessions_router
from circuits.routes import router as circuits_router
from users.routes import router as users_router, admin_router
from dashboard.routes import router as dashboard_router
from sqlalchemy.orm import Session

# Create tables if not exists (although init.sql should handle it)
# Base.metadata.create_all(bind=engine)

app = FastAPI()

# Inclure les routes D'ABORD
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(circuits_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(dashboard_router)

# Configuration CORS APRÈS les routes
app.add_middleware(
    CORSMiddleware,
    # Autorise tout pour éviter les problèmes en dev (téléphone, IP locale, etc)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/fix-database")
async def fix_database(db: Session = Depends(get_db)):
    """Endpoint temporaire pour ajouter les colonnes manquantes"""
    try:
        # Ajouter les colonnes manquantes
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'driver'"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS license_expiry DATE"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()"))

        # Ajouter la contrainte CHECK pour les rôles
        db.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'users_role_check'
                ) THEN
                    ALTER TABLE users ADD CONSTRAINT users_role_check
                    CHECK (role IN ('admin', 'commissaire', 'mechanic', 'instructor', 'driver', 'spectator', 'commissaire_piste'));
                END IF;
            END $$
        """))

        # Mettre à jour les utilisateurs existants
        db.execute(text("UPDATE users SET role = 'driver' WHERE role IS NULL"))
        db.execute(text("UPDATE users SET is_active = TRUE WHERE is_active IS NULL"))
        db.execute(text("UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL"))

        # Mettre le user 'pilot' en admin
        db.execute(text("UPDATE users SET role = 'admin' WHERE username = 'pilot'"))

        db.commit()

        return {"status": "success", "message": "Base de données mise à jour avec succès"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
