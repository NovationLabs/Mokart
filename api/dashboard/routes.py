from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DbSession
from config.database import get_db
from models import sql_models
from models.dashboard import DashboardData, KartStatus, ElectricalModule, CircuitInfo, UserStats, SystemStatus
from models.auth import LoginRequest, RegisterRequest, AuthResponse
import hashlib
import uuid
import datetime
import random
import json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_user_role(user_id: str, db: DbSession) -> str:
    """Récupère le rôle de l'utilisateur depuis la base de données"""
    try:
        user = db.query(sql_models.User).filter(sql_models.User.id == uuid.UUID(user_id)).first()
        if user:
            return user.role or "pilot"

        # Mode démo - si l'utilisateur n'existe pas en BDD
        if user_id == "550e8400-e29b-41d4-a716-446655440001":
            return "admin"

        return "pilot"
    except:
        return "pilot"

def generate_fake_electrical_data() -> list[ElectricalModule]:
    """Génère des données factices pour les modules électriques et UWB"""
    modules = []
    kart_ids = ["kart_001", "kart_002", "kart_003", "kart_004"]

    for kart_id in kart_ids:
        # Module Point One (GPS/localisation)
        modules.append(ElectricalModule(
            kart_id=kart_id,
            module_type="point_one",
            status="online" if random.random() > 0.1 else "offline",
            battery_voltage=round(random.uniform(3.2, 4.2), 2),
            signal_strength=round(random.uniform(-60, -30), 1),
            last_update=datetime.datetime.now(),
            data={
                "latitude": round(random.uniform(43.1000, 43.2000), 6),
                "longitude": round(random.uniform(6.1000, 6.2000), 6),
                "accuracy": round(random.uniform(0.5, 2.0), 1),
                "satellites": random.randint(8, 12)
            }
        ))

        # Module UWB (Ultra-Wideband)
        modules.append(ElectricalModule(
            kart_id=kart_id,
            module_type="uwb",
            status="online" if random.random() > 0.05 else "offline",
            battery_voltage=round(random.uniform(3.0, 4.0), 2),
            signal_strength=round(random.uniform(-70, -40), 1),
            last_update=datetime.datetime.now(),
            data={
                "x_position": round(random.uniform(0, 100), 2),
                "y_position": round(random.uniform(0, 100), 2),
                "z_position": round(random.uniform(0, 5), 2),
                "anchor_count": random.randint(4, 8),
                "position_accuracy": round(random.uniform(0.1, 0.5), 2)
            }
        ))

        # Module batterie
        modules.append(ElectricalModule(
            kart_id=kart_id,
            module_type="battery_controller",
            status="online",
            battery_voltage=round(random.uniform(48.0, 52.8), 1),
            signal_strength=None,
            last_update=datetime.datetime.now(),
            data={
                "current": round(random.uniform(10.0, 50.0), 1),
                "temperature": round(random.uniform(20.0, 45.0), 1),
                "charge_cycles": random.randint(100, 500),
                "health": random.choice(["good", "fair", "poor"]),
                "estimated_runtime": random.randint(30, 120)
            }
        ))

    return modules

def generate_fake_karts_status() -> list[KartStatus]:
    """Génère des données factices pour le statut des karts"""
    karts = []
    drivers = ["Jean Pilot", "Marie Racer", "Pierre Speed", "Sophie Fast"]

    for i, driver in enumerate(drivers):
        karts.append(KartStatus(
            id=f"kart_{i+1:03d}",
            name=f"SodiKart RT8-{i+1}",
            driver=driver,
            battery_level=round(random.uniform(20.0, 95.0), 1),
            status=random.choice(["online", "online", "online", "charging", "maintenance"]),
            last_seen=datetime.datetime.now() if random.random() > 0.2 else datetime.datetime.now() - datetime.timedelta(minutes=random.randint(5, 60)),
            location={
                "x": round(random.uniform(0, 100), 2),
                "y": round(random.uniform(0, 100), 2)
            } if random.random() > 0.3 else None
        ))

    return karts

@router.get("/data", response_model=DashboardData)
async def get_dashboard_data(user_id: str = None, role: str = None, db: DbSession = Depends(get_db)):
    """Récupère les données du dashboard selon le rôle de l'utilisateur"""

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id requis")

    # Si un rôle est fourni en paramètre, l'utiliser (pour les tests)
    if role:
        user_role = role
    else:
        user_role = get_user_role(user_id, db)

    # Données communes
    circuit_info = CircuitInfo(
        id="circuit_001",
        name="SPEEDKART Hyères",
        status="active",
        temperature=24.0,
        humidity=42.0,
        grip_level="High",
        active_karts=3
    )

    # Données selon le rôle
    if user_role == "admin":
        # Admin voit tout
        electrical_modules = generate_fake_electrical_data()
        karts_status = generate_fake_karts_status()

        system_status = SystemStatus(
            total_users=24,
            active_sessions=3,
            total_karts=4,
            online_karts=3,
            system_health="good",
            last_backup=datetime.datetime.now() - datetime.timedelta(hours=2)
        )

        return DashboardData(
            user_role=user_role,
            karts_status=karts_status,
            electrical_modules=electrical_modules,
            circuit_info=circuit_info,
            system_status=system_status
        )

    elif user_role == "driver":
        # Pilote voit ses stats et le circuit
        user_stats = UserStats(
            total_laps=1248,
            best_lap_time=48.2,
            avg_lap_time=52.4,
            top_speed=84.0,
            consistency=94.0,
            last_session_date=datetime.datetime.now() - datetime.timedelta(days=1)
        )

        return DashboardData(
            user_role=user_role,
            user_stats=user_stats,
            circuit_info=circuit_info
        )

    elif user_role == "mechanic":
        # Mécanicien voit le statut des karts et modules électriques
        karts_status = generate_fake_karts_status()
        electrical_modules = generate_fake_electrical_data()

        return DashboardData(
            user_role=user_role,
            karts_status=karts_status,
            electrical_modules=electrical_modules,
            circuit_info=circuit_info
        )

    else:  # commissaire_piste
        return DashboardData(
            user_role=user_role,
            karts_status=generate_fake_karts_status(),
            circuit_info=circuit_info
        )
