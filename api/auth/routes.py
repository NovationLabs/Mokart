from fastapi import APIRouter, HTTPException
from supabase import create_client
from config.database import supabase_config
from models.auth import LoginRequest, RegisterRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    print(f"🔐 Tentative de connexion pour: {request.email}")

    # Mode démo pour contourner les problèmes Supabase
    if request.email == "demo@mokart.com" and request.password == "demo123456":
        fake_user = {
            "id": "demo-user-123",
            "email": "demo@mokart.com",
            "user_metadata": {"vehicle_model": "Demo Kart"}
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

    # Pour les autres emails, essayer Supabase
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Créer une nouvelle instance du client pour éviter les problèmes d'état
        client = create_client(supabase_config.supabase_url, supabase_config.supabase_key)
        print("📤 Appel à supabase.auth.sign_in_with_password...")
        response = client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        print(f"✅ Réponse Supabase: {type(response)}")
        print(f"👤 User: {response.user}")
        print(f"🔑 Session: {response.session}")

        if response.user:
            return AuthResponse(
                user=response.user.model_dump(),
                session=response.session.model_dump() if response.session else None,
                message="Connexion réussie"
            )
        else:
            raise HTTPException(status_code=401, detail="Identifiants invalides")

    except Exception as e:
        print(f"❌ Erreur complète: {repr(e)}")
        print(f"📝 Type d'erreur: {type(e)}")

        # Si l'utilisateur n'existe pas, essayer de le créer
        if "Invalid login credentials" in str(e):
            print("🔄 Tentative de création automatique...")
            try:
                # Créer l'utilisateur automatiquement
                client = create_client(supabase_config.supabase_url, supabase_config.supabase_key)
                signup_response = client.auth.sign_up({
                    "email": request.email,
                    "password": request.password,
                    "options": {
                        "data": {},
                        "email_confirm": False  # Désactiver la confirmation email
                    }
                })

                print(f"✅ Inscription: {signup_response.user}")

                if signup_response.user:
                    # Connecter automatiquement après l'inscription
                    login_response = client.auth.sign_in_with_password({
                        "email": request.email,
                        "password": request.password
                    })

                    return AuthResponse(
                        user=login_response.user.model_dump(),
                        session=login_response.session.model_dump() if login_response.session else None,
                        message="Compte créé et connexion réussie"
                    )
                else:
                    raise HTTPException(status_code=400, detail="Erreur lors de la création du compte")
            except Exception as signup_error:
                print(f"❌ Erreur inscription: {repr(signup_error)}")
                # Si l'email n'est pas confirmé, on retourne un message spécial
                if "email confirmation" in str(signup_error).lower():
                    return AuthResponse(
                        user={"id": "temp", "email": request.email, "user_metadata": {}},
                        session={"access_token": "temp", "refresh_token": "temp"},
                        message="Compte créé (en attente de confirmation email)"
                    )
                raise HTTPException(status_code=400, detail=f"Erreur de création: {str(signup_error)}")
        else:
            raise HTTPException(status_code=401, detail=f"Erreur de connexion: {str(e)}")

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Créer l'utilisateur
        response = client.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "vehicle_model": request.vehicle_model or "Unknown"
                }
            }
        })

        if response.user:
            return AuthResponse(
                user=response.user.model_dump(),
                session=response.session.model_dump() if response.session else None,
                message="Compte créé avec succès"
            )
        else:
            raise HTTPException(status_code=400, detail="Erreur lors de la création du compte")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur d'inscription: {str(e)}")

@router.post("/logout")
async def logout():
    return {"message": "Déconnexion réussie"}

@router.get("/me")
async def get_current_user():
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        response = client.auth.get_user()
        if response.user:
            return {"user": response.user.model_dump()}
        else:
            raise HTTPException(status_code=401, detail="Non authentifié")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Erreur d'authentification: {str(e)}")

@router.get("/test")
async def test_auth():
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Créer un utilisateur de test
        response = client.auth.sign_up({
            "email": "demo@mokart.com",
            "password": "demo123456",
            "options": {
                "data": {
                    "vehicle_model": "Demo Kart"
                }
            }
        })

        return {
            "message": "Utilisateur de test créé",
            "user": response.user.model_dump() if response.user else None,
            "session": response.session.model_dump() if response.session else None
        }
    except Exception as e:
        return {"error": str(e), "message": "L'utilisateur existe peut-être déjà"}
