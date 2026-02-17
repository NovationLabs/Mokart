from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

load_dotenv()

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qqjzcohrjhcambgulhae.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY_SECRET")

supabase: Client = None
if SUPABASE_KEY and SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase connecté")
        print(f"🔑 URL: {SUPABASE_URL}")
        print(f"🔑 Key type: {type(SUPABASE_KEY)}")
        print(f"🔑 Key length: {len(SUPABASE_KEY)}")
    except Exception as e:
        print(f"⚠️ Erreur de connexion Supabase: {e}")
        supabase = None
else:
    print("⚠️ SUPABASE_KEY_SECRET ou SUPABASE_URL non configuré")
    supabase = None

# Modèles de données
class Session(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    vehicle_model: Optional[str] = None
    created_at: Optional[datetime] = None

class SensorData(BaseModel):
    session_id: str
    timestamp: int
    uwb_x: Optional[float] = None
    uwb_y: Optional[float] = None
    uwb_z: Optional[float] = None
    imu_ax: Optional[float] = None
    imu_ay: Optional[float] = None
    imu_az: Optional[float] = None
    imu_gx: Optional[float] = None
    imu_gy: Optional[float] = None
    imu_gz: Optional[float] = None
    steering_angle: Optional[float] = None

class TrajectoryPoint(BaseModel):
    x: float
    y: float
    timestamp: int
    steering_angle: Optional[float] = None

# Modèles d'authentification
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    vehicle_model: Optional[str] = None

class AuthResponse(BaseModel):
    user: dict
    session: Optional[dict] = None
    message: str

@app.get("/")
async def main():
    return {"message": "Mokart API", "status": "running", "supabase": supabase is not None}

@app.get("/health")
async def health_check():
    if supabase:
        try:
            response = supabase.table('sessions').select('*').limit(1).execute()
            return {"status": "healthy", "supabase": "connected"}
        except Exception as e:
            return {"status": "healthy", "supabase": "disconnected", "error": str(e)}
    else:
        return {"status": "healthy", "supabase": "not_configured"}

@app.get("/auth/test")
async def test_auth():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Créer un utilisateur de test
        response = supabase.auth.sign_up({
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

# Endpoints d'authentification
@app.post("/auth/login", response_model=AuthResponse)
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
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Créer une nouvelle instance du client pour éviter les problèmes d'état
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
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
                client = create_client(SUPABASE_URL, SUPABASE_KEY)
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

@app.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Créer l'utilisateur
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "vehicle_model": request.vehicle_model
                }
            }
        })

        if response.user:
            # Connecter automatiquement après l'inscription
            login_response = supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password
            })

            return AuthResponse(
                user=login_response.user.model_dump(),
                session=login_response.session.model_dump() if login_response.session else None,
                message="Inscription et connexion réussies"
            )
        else:
            raise HTTPException(status_code=400, detail="Erreur lors de l'inscription")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur d'inscription: {str(e)}")

@app.post("/auth/logout")
async def logout():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        supabase.auth.sign_out()
        return {"message": "Déconnexion réussie"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de déconnexion: {str(e)}")

@app.get("/auth/me")
async def get_current_user():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        user = supabase.auth.get_user()
        if user:
            return {"user": user.model_dump()}
        else:
            raise HTTPException(status_code=401, detail="Non authentifié")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Erreur d'authentification: {str(e)}")

# Sessions endpoints
@app.get("/sessions", response_model=List[Session])
async def get_sessions(user_id: Optional[str] = None):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        query = supabase.table('sessions').select('*')
        if user_id:
            query = query.eq('user_id', user_id)
        query = query.order('created_at', desc=True)

        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions", response_model=Session)
async def create_session(session: Session):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        response = supabase.table('sessions').insert({
            'user_id': session.user_id,
            'vehicle_model': session.vehicle_model
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Sensor data endpoints
@app.get("/sessions/{session_id}/trajectory", response_model=List[TrajectoryPoint])
async def get_trajectory(session_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        response = supabase.table('sensor_data').select(
            'timestamp, uwb_x, uwb_y, steering_angle'
        ).eq('session_id', session_id).order('timestamp').execute()

        # Convertir en TrajectoryPoint
        trajectory = []
        for data in response.data:
            if data['uwb_x'] is not None and data['uwb_y'] is not None:
                trajectory.append(TrajectoryPoint(
                    x=data['uwb_x'],
                    y=data['uwb_y'],
                    timestamp=data['timestamp'],
                    steering_angle=data.get('steering_angle')
                ))

        return trajectory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions/{session_id}/data")
async def add_sensor_data(session_id: str, data: List[SensorData]):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Ajouter session_id à chaque point de données
        data_with_session = [
            {**item.dict(), 'session_id': session_id}
            for item in data
        ]

        response = supabase.table('sensor_data').insert(data_with_session).execute()
        return {"message": f"Added {len(response.data)} data points"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}/stats")
async def get_session_stats(session_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Récupérer tous les points de la session
        response = supabase.table('sensor_data').select('*').eq('session_id', session_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        data = response.data

        # Calculer les statistiques
        stats = {
            "session_id": session_id,
            "total_points": len(data),
            "duration_ms": data[-1]['timestamp'] - data[0]['timestamp'] if len(data) > 1 else 0,
            "uwb_coverage": len([d for d in data if d['uwb_x'] is not None]) / len(data) * 100,
            "imu_coverage": len([d for d in data if d['imu_ax'] is not None]) / len(data) * 100,
            "steering_coverage": len([d for d in data if d['steering_angle'] is not None]) / len(data) * 100,
            "bounds": {
                "min_x": min(d['uwb_x'] for d in data if d['uwb_x'] is not None),
                "max_x": max(d['uwb_x'] for d in data if d['uwb_x'] is not None),
                "min_y": min(d['uwb_y'] for d in data if d['uwb_y'] is not None),
                "max_y": max(d['uwb_y'] for d in data if d['uwb_y'] is not None)
            }
        }

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
