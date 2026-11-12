import logging

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy import text
from sqlalchemy.orm import Session as DbSession
from config.database import get_db
from models.auth import LoginRequest, RegisterRequest, AuthResponse
from .passwords import hash_password, verify_password, needs_rehash, check_strength
from .tokens import create_access_token
from .rate_limit import SlidingWindowLimiter, client_ip
from .demo import DEMO_USER_ID, DEMO_EMAIL, DEMO_ROLE, demo_enabled

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("mokart.auth")

login_by_email = SlidingWindowLimiter(max_hits=5, window_s=900)
login_by_ip = SlidingWindowLimiter(max_hits=30, window_s=900)
register_by_ip = SlidingWindowLimiter(max_hits=10, window_s=3600)

INVALID_CREDENTIALS = HTTPException(status_code=401, detail="Identifiants invalides")
TOO_MANY = HTTPException(status_code=429, detail="Trop de tentatives, réessaie dans quelques minutes")

USER_COLUMNS = "id, email, username, password_hash, role, is_active, first_name, last_name, phone, kart, created_at"


def _is_active(value) -> bool:
    return value not in (False, "false", "f", "0", 0)


def _user_payload(row) -> dict:
    return {
        "id": str(row.id),
        "email": row.email,
        "username": row.username,
        "role": row.role or "driver",
        "first_name": row.first_name,
        "last_name": row.last_name,
        "phone": row.phone,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "user_metadata": {"kart": row.kart},
    }


def generate_unique_username(email: str, db: DbSession) -> str:
    base_username = email.split('@')[0][:40] or "pilote"
    username = base_username
    counter = 1
    # Vérifier si le username existe déjà
    while db.execute(text("SELECT 1 FROM users WHERE username = :u"), {"u": username}).first():
        username = f"{base_username}{counter}"
        counter += 1
    return username


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request, db: DbSession = Depends(get_db)):
    email = payload.email.strip().lower()
    ip = client_ip(request)

    if login_by_email.blocked(email) or login_by_ip.blocked(ip):
        raise TOO_MANY

    # Mode démo
    if email == DEMO_EMAIL:
        if not demo_enabled():
            raise HTTPException(status_code=403, detail="Mode démo indisponible")
        login_by_ip.hit(ip)
        return AuthResponse(
            user={
                "id": DEMO_USER_ID,
                "email": DEMO_EMAIL,
                "username": "demo",
                "role": DEMO_ROLE,
                "first_name": "Démo",
                "last_name": "Mokart",
                "user_metadata": {"kart": "SodiKart RT8"},
            },
            session=create_access_token(DEMO_USER_ID, DEMO_ROLE, demo=True),
            message="Connexion démo réussie",
        )

    # Chercher l'utilisateur dans la DB locale
    row = db.execute(
        text(f"SELECT {USER_COLUMNS} FROM users WHERE lower(email) = :email"),
        {"email": email},
    ).fetchone()

    # Vérifier le mot de passe
    if not row or not verify_password(payload.password, row.password_hash) or not _is_active(row.is_active):
        login_by_email.hit(email)
        login_by_ip.hit(ip)
        logger.info("échec de connexion pour un compte depuis %s", ip)
        raise INVALID_CREDENTIALS

    login_by_email.reset(email)

    if needs_rehash(row.password_hash):
        db.execute(
            text("UPDATE users SET password_hash = :h WHERE id = :id"),
            {"h": hash_password(payload.password), "id": row.id},
        )
        db.commit()

    return AuthResponse(
        user=_user_payload(row),
        session=create_access_token(str(row.id), row.role or "driver"),
        message="Connexion réussie",
    )


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest, request: Request, db: DbSession = Depends(get_db)):
    ip = client_ip(request)
    if register_by_ip.blocked(ip):
        raise TOO_MANY
    register_by_ip.hit(ip)

    # Vérifier que les mots de passe correspondent
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Les mots de passe ne correspondent pas")
    try:
        check_strength(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    email = payload.email.strip().lower()
    if email == DEMO_EMAIL or "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Email invalide")

    # Vérifier si l'utilisateur existe déjà
    if db.execute(text("SELECT 1 FROM users WHERE lower(email) = :email"), {"email": email}).first():
        raise HTTPException(status_code=400, detail="Impossible de créer ce compte")

    try:
        row = db.execute(
            text(f"""
            INSERT INTO users (email, username, password_hash, kart, role, is_active)
            VALUES (:email, :username, :password_hash, :kart, 'driver', TRUE)
            RETURNING {USER_COLUMNS}
            """),
            {
                "email": email,
                "username": generate_unique_username(email, db),
                "password_hash": hash_password(payload.password),
                "kart": (payload.kart or "Default Kart")[:80],
            },
        ).fetchone()
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("échec de création de compte")
        raise HTTPException(status_code=400, detail="Impossible de créer ce compte")

    return AuthResponse(
        user=_user_payload(row),
        session=create_access_token(str(row.id), "driver"),
        message="Compte créé avec succès",
    )
