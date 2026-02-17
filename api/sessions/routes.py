from fastapi import APIRouter, HTTPException
from config.database import supabase_config
from models.session import Session, SensorData, TrajectoryPoint

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("/", response_model=list[Session])
async def get_sessions():
    """Récupérer toutes les sessions"""
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        response = client.table('sessions').select('*').execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/stats")
async def get_session_stats(session_id: str):
    """Récupérer les statistiques d'une session"""
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Récupérer tous les points de la session
        response = client.table('sensor_data').select('*').eq('session_id', session_id).execute()

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

@router.get("/{session_id}/trajectory", response_model=list[TrajectoryPoint])
async def get_session_trajectory(session_id: str):
    """Récupérer la trajectoire d'une session"""
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # Récupérer les données UWB de la session
        response = client.table('sensor_data').select('timestamp, uwb_x, uwb_y, steering_angle').eq('session_id', session_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Session non trouvée")

        # Filtrer les points valides et convertir en TrajectoryPoint
        trajectory = []
        for point in response.data:
            if point['uwb_x'] is not None and point['uwb_y'] is not None:
                trajectory.append(TrajectoryPoint(
                    x=point['uwb_x'],
                    y=point['uwb_y'],
                    timestamp=point['timestamp'],
                    steering_angle=point.get('steering_angle')
                ))

        return trajectory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Session)
async def create_session(session: Session):
    """Créer une nouvelle session"""
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        response = client.table('sessions').insert(session.model_dump(exclude_none=True)).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Erreur lors de la création de la session")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/sensor-data", response_model=SensorData)
async def add_sensor_data(session_id: str, sensor_data: SensorData):
    """Ajouter des données de capteur à une session"""
    client = supabase_config.get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase non connecté")

    try:
        # S'assurer que le session_id correspond
        sensor_data.session_id = session_id
        
        response = client.table('sensor_data').insert(sensor_data.model_dump(exclude_none=True)).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Erreur lors de l'ajout des données")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
