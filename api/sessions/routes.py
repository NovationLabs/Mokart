from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import func
from config.database import get_db
from models.session import Session, SensorData, TrajectoryPoint
from models import sql_models
import uuid

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("/", response_model=list[Session])
async def get_sessions(db: DbSession = Depends(get_db)):
    """Récupérer toutes les sessions"""
    try:
        sessions = db.query(sql_models.Session).all()
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/stats")
async def get_session_stats(session_id: str, db: DbSession = Depends(get_db)):
    """Récupérer les statistiques d'une session"""
    try:
        # Récupérer tous les points de la session
        data = db.query(sql_models.SensorData)\
            .filter(sql_models.SensorData.session_id == session_id)\
            .order_by(sql_models.SensorData.timestamp)\
            .all()

        if not data:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Calculer les statistiques
        # Note: data contient des objets SQLAlchemy, on accède par attributs .nom

        # Filtres pour les caluls
        uwb_points = [d.uwb_x for d in data if d.uwb_x is not None]
        uwb_y_points = [d.uwb_y for d in data if d.uwb_y is not None]

        stats = {
            "session_id": session_id,
            "total_points": len(data),
            "duration_ms": data[-1].timestamp - data[0].timestamp if len(data) > 1 else 0,

            # Pourcentages de couverture (champs non null)
            "uwb_coverage": len([d for d in data if d.uwb_x is not None]) / len(data) * 100,
            "imu_coverage": len([d for d in data if d.imu_ax is not None]) / len(data) * 100,
            "steering_coverage": len([d for d in data if d.steering_angle is not None]) / len(data) * 100,

            "bounds": {
                "min_x": min(uwb_points) if uwb_points else 0,
                "max_x": max(uwb_points) if uwb_points else 0,
                "min_y": min(uwb_y_points) if uwb_y_points else 0,
                "max_y": max(uwb_y_points) if uwb_y_points else 0
            }
        }

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/trajectory", response_model=list[TrajectoryPoint])
async def get_session_trajectory(session_id: str, db: DbSession = Depends(get_db)):
    """Récupérer la trajectoire d'une session"""
    try:
        # Récupérer les données UWB de la session
        # On ne sélectionne que les colonnes nécessaires
        query = db.query(
            sql_models.SensorData.timestamp,
            sql_models.SensorData.uwb_x,
            sql_models.SensorData.uwb_y,
            sql_models.SensorData.steering_angle
        ).filter(
            sql_models.SensorData.session_id == session_id
        ).order_by(sql_models.SensorData.timestamp)

        results = query.all()

        if not results:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Filtrer et convertir
        trajectory = []
        for point in results:
            # point est un Row/Tuple nommé ici
            if point.uwb_x is not None and point.uwb_y is not None:
                trajectory.append(TrajectoryPoint(
                    x=point.uwb_x,
                    y=point.uwb_y,
                    timestamp=point.timestamp,
                    steering_angle=point.steering_angle
                ))

        return trajectory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Session)
async def create_session(session: Session, db: DbSession = Depends(get_db)):
    """Créer une nouvelle session"""
    try:
        session_id = None
        if session.id:
            try:
                session_id = uuid.UUID(session.id)
            except ValueError:
                session_id = uuid.uuid4()
        else:
            session_id = uuid.uuid4()

        new_session = sql_models.Session(
            id=session_id,
            user_id=uuid.UUID(session.user_id) if session.user_id else uuid.uuid4(), # Should be valid UUID
            kart=session.kart
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return new_session
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/sensor-data", response_model=SensorData)
async def add_sensor_data(session_id: str, sensor_data: SensorData, db: DbSession = Depends(get_db)):
    """Ajouter des données de capteur à une session"""
    try:
        # S'assurer que le session_id correspond
        sensor_data.session_id = session_id

        # Créer l'objet SQL
        new_data = sql_models.SensorData(
            session_id=uuid.UUID(session_id),
            timestamp=sensor_data.timestamp,
            uwb_x=sensor_data.uwb_x,
            uwb_y=sensor_data.uwb_y,
            uwb_z=sensor_data.uwb_z,
            imu_ax=sensor_data.imu_ax,
            imu_ay=sensor_data.imu_ay,
            imu_az=sensor_data.imu_az,
            imu_gx=sensor_data.imu_gx,
            imu_gy=sensor_data.imu_gy,
            imu_gz=sensor_data.imu_gz,
            steering_angle=sensor_data.steering_angle
        )

        db.add(new_data)
        db.commit()
        db.refresh(new_data)

        return new_data
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
