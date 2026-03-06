from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DbSession
from config.database import get_db
from models import sql_models
from models.auth import LoginRequest, RegisterRequest, AuthResponse
import hashlib
import uuid
import datetime
import random
import string

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_unique_username(email: str, db: DbSession) -> str:
    """Génère un username unique basé sur l'email"""
    base_username = email.split('@')[0]
    username = base_username

    # Vérifier si le username existe déjà
    counter = 1
    while db.query(sql_models.User).filter(sql_models.User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    return username

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: DbSession = Depends(get_db)):
    print(f"🔐 Tentative de connexion pour: {request.email}")

    # Mode démo
    if request.email == "demo@mokart.com" and request.password == "demo123456":
        fake_user = {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "email": "demo@mokart.com",
            "username": "pilot",
            "role": "admin",
            "first_name": "Jean",
            "last_name": "Pilot",
            "phone": "0612345678",
            "user_metadata": {"kart": "SodiKart RT8"}
        }
        fake_session = {
            "access_token": "demo-token",
            "refresh_token": "demo-refresh"
        }
        return AuthResponse(
            user=fake_user,
            session=fake_session,
            message="Connexion démo réussie"
        )

    try:
        # Chercher l'utilisateur dans la DB locale
        user = db.query(sql_models.User).filter(sql_models.User.email == request.email).first()

        hashed_pw = hash_password(request.password)

        if user:
            # Vérifier le mot de passe
            if user.password_hash == hashed_pw:
                user_dict = {
                    "id": str(user.id),
                    "email": user.email,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "user_metadata": {"kart": user.kart}
                }
                session_dict = {
                    "access_token": f"local-token-{user.id}",
                    "refresh_token": "local-refresh-token",
                    "expires_at": (datetime.datetime.now() + datetime.timedelta(days=1)).timestamp()
                }
                return AuthResponse(
                    user=user_dict,
                    session=session_dict,
                    message="Connexion réussie"
                )
            else:
                raise HTTPException(status_code=401, detail="Identifiants invalides")
        else:
                raise HTTPException(status_code=404, detail="Ce compte n'existe pas. Veuillez vous inscrire.")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: DbSession = Depends(get_db)):
    try:
        # Vérifier que les mots de passe correspondent
        if request.password != request.confirm_password:
            raise HTTPException(status_code=400, detail="Les mots de passe ne correspondent pas")

        # Vérifier si l'utilisateur existe déjà
        if db.query(sql_models.User).filter(sql_models.User.email == request.email).first():
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

        hashed_pw = hash_password(request.password)

        new_user = sql_models.User(
            email=request.email,
            username=generate_unique_username(request.email, db),
            password_hash=hashed_pw,
            kart=request.kart or "Default Kart"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        user_dict = {
            "id": str(new_user.id),
            "email": new_user.email,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
            "user_metadata": {"kart": new_user.kart}
        }
        session_dict = {
            "access_token": f"local-token-{new_user.id}",
            "refresh_token": "local-refresh-token",
            "expires_at": (datetime.datetime.now() + datetime.timedelta(days=1)).timestamp()
        }

        return AuthResponse(
            user=user_dict,
            session=session_dict,
            message="Compte créé avec succès"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
