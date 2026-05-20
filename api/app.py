from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from config.database import get_db, engine, Base
from auth.routes import router as auth_router
from sessions.routes import router as sessions_router
from circuits.routes import router as circuits_router
from users.routes import router as users_router, admin_router
from dashboard.routes import router as dashboard_router
from installer.routes import router as installer_router
from sqlalchemy.orm import Session
import asyncio

# Create tables if not exists (although init.sql should handle it)
# Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuration du timeout global
@app.middleware("http")
async def add_timeout_middleware(request, call_next):
    try:
        # Timeout de 30 secondes pour les requêtes
        return await asyncio.wait_for(call_next(request), timeout=30.0)
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=408,
            content={"detail": "Request timeout - l'opération a pris trop de temps"}
        )

# Inclure les routes D'ABORD
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(circuits_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(dashboard_router)
app.include_router(installer_router)

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

@app.post("/seed-users")
async def seed_users(db: Session = Depends(get_db)):
    """Endpoint pour ajouter des utilisateurs factices"""
    try:
        from sqlalchemy import text
        import uuid

        # Supprimer les utilisateurs existants (sauf admin)
        db.execute(text("DELETE FROM users WHERE username NOT IN ('pilot', 'expert')"))

        # Insérer des utilisateurs factices
        users_data = [
            (str(uuid.uuid4()), 'driver1', 'martin.dubois@email.com', 'hash_password123', 'Martin', 'Dubois', '0612345678', 'TonyKart Racer', 'driver', True, 'LIC-001-2024', '2024-12-31', '30 days'),
            (str(uuid.uuid4()), 'driver2', 'sophie.bernard@email.com', 'hash_password123', 'Sophie', 'Bernard', '0623456789', 'SodiKart RT8', 'driver', True, 'LIC-002-2024', '2024-12-31', '25 days'),
            (str(uuid.uuid4()), 'driver3', 'thomas.martin@email.com', 'hash_password123', 'Thomas', 'Martin', '0634567890', 'CRG KT1', 'driver', True, 'LIC-003-2024', '2024-12-31', '20 days'),
            (str(uuid.uuid4()), 'driver4', 'camille.petit@email.com', 'hash_password123', 'Camille', 'Petit', '0645678901', 'BirelART', 'driver', True, 'LIC-004-2024', '2024-12-31', '15 days'),
            (str(uuid.uuid4()), 'driver5', 'lucas.robert@email.com', 'hash_password123', 'Lucas', 'Robert', '0656789012', 'TonyKart Racer', 'driver', True, 'LIC-005-2024', '2024-12-31', '10 days'),
            (str(uuid.uuid4()), 'mech1', 'pierre.durand@email.com', 'hash_password123', 'Pierre', 'Durand', '0667890123', None, 'mechanic', True, None, None, '45 days'),
            (str(uuid.uuid4()), 'mech2', 'alice.legrand@email.com', 'hash_password123', 'Alice', 'Legrand', '0678901234', None, 'mechanic', True, None, None, '60 days'),
            (str(uuid.uuid4()), 'inst1', 'francois.morel@email.com', 'hash_password123', 'François', 'Morel', '0689012345', 'SodiKart RT8', 'instructor', True, 'LIC-INST-001', '2024-12-31', '90 days'),
            (str(uuid.uuid4()), 'inst2', 'isabelle.simon@email.com', 'hash_password123', 'Isabelle', 'Simon', '0690123456', 'TonyKart Racer', 'instructor', True, 'LIC-INST-002', '2024-12-31', '120 days'),
            (str(uuid.uuid4()), 'comm1', 'jacques.leroy@email.com', 'hash_password123', 'Jacques', 'Leroy', '0701234567', None, 'commissaire', True, None, None, '150 days'),
            (str(uuid.uuid4()), 'comm2', 'marie.garcia@email.com', 'hash_password123', 'Marie', 'Garcia', '0712345678', None, 'commissaire', True, None, None, '180 days'),
            (str(uuid.uuid4()), 'spec1', 'nicolas.roux@email.com', 'hash_password123', 'Nicolas', 'Roux', '0723456789', None, 'spectator', True, None, None, '5 days'),
            (str(uuid.uuid4()), 'spec2', 'emilie.blanc@email.com', 'hash_password123', 'Emilie', 'Blanc', '0734567890', None, 'spectator', True, None, None, '2 days'),
            (str(uuid.uuid4()), 'inactive1', 'antoine.fischer@email.com', 'hash_password123', 'Antoine', 'Fischer', '0745678901', 'CRG KT1', 'driver', False, 'LIC-006-2024', '2024-12-31', '200 days'),
            (str(uuid.uuid4()), 'inactive2', 'julie.muller@email.com', 'hash_password123', 'Julie', 'Muller', '0756789012', 'BirelART', 'driver', False, 'LIC-007-2024', '2024-12-31', '365 days'),
            (str(uuid.uuid4()), 'newdriver1', 'paul.wagner@email.com', 'hash_password123', 'Paul', 'Wagner', '0767890123', 'TonyKart Racer', 'driver', True, 'LIC-008-2024', '2024-12-31', '5 days'),
            (str(uuid.uuid4()), 'newdriver2', 'laura.schmidt@email.com', 'hash_password123', 'Laura', 'Schmidt', '0778901234', 'SodiKart RT8', 'driver', True, 'LIC-009-2024', '2024-12-31', '3 days'),
            (str(uuid.uuid4()), 'newmech1', 'matthieu.klein@email.com', 'hash_password123', 'Matthieu', 'Klein', '0789012345', None, 'mechanic', True, None, None, '7 days'),
        ]

        for user in users_data:
            query = text("""
                INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, kart, role, is_active, license_number, license_expiry, created_at, updated_at)
                VALUES (:id, :username, :email, :password_hash, :first_name, :last_name, :phone, :kart, :role, :is_active, :license_number, :license_expiry, NOW() - INTERVAL :days_ago, NOW())
            """)
            db.execute(query, {
                'id': user[0], 'username': user[1], 'email': user[2], 'password_hash': user[3],
                'first_name': user[4], 'last_name': user[5], 'phone': user[6], 'kart': user[7],
                'role': user[8], 'is_active': user[9], 'license_number': user[10],
                'license_expiry': user[11], 'days_ago': user[12]
            })

        db.commit()
        return {"status": "success", "message": f"{len(users_data)} utilisateurs factices ajoutés"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

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
