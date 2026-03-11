from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DbSession
from config.database import get_db
from models import sql_models
from pydantic import BaseModel
import uuid
from .trajectory_algorithm import TrajectoryOptimizer

router = APIRouter(prefix="/circuits", tags=["circuits"])

class CircuitResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str

class CircuitBoundaryResponse(BaseModel):
    id: str
    circuit_id: str
    side: str
    point_order: int
    x: float
    y: float

class OptimalTrajectoryPointResponse(BaseModel):
    id: str
    circuit_id: str
    point_order: int
    x: float
    y: float
    created_at: str

class TrajectoryComparisonResponse(BaseModel):
    session_id: str
    optimal_trajectory: list
    actual_trajectory: list
    deviation_stats: dict

@router.get("/", response_model=list[CircuitResponse])
async def get_circuits(db: DbSession = Depends(get_db)):
    """Récupérer tous les circuits"""
    try:
        circuits = db.query(sql_models.Circuit).all()

        circuit_list = []
        for circuit in circuits:
            circuit_dict = {
                "id": str(circuit.id),
                "name": circuit.name,
                "description": circuit.description or "",
                "created_at": circuit.created_at.isoformat() if circuit.created_at else ""
            }
            circuit_list.append(CircuitResponse(**circuit_dict))

        return circuit_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{circuit_id}/boundaries", response_model=list[CircuitBoundaryResponse])
async def get_circuit_boundaries(circuit_id: str, db: DbSession = Depends(get_db)):
    """Récupérer les points de délimitation d'un circuit"""
    try:
        boundaries = db.query(sql_models.CircuitBoundary)\
            .filter(sql_models.CircuitBoundary.circuit_id == circuit_id)\
            .order_by(sql_models.CircuitBoundary.side, sql_models.CircuitBoundary.point_order)\
            .all()

        boundary_list = []
        for boundary in boundaries:
            boundary_dict = {
                "id": str(boundary.id),
                "circuit_id": str(boundary.circuit_id),
                "side": boundary.side,
                "point_order": boundary.point_order,
                "x": float(boundary.x),
                "y": float(boundary.y)
            }
            boundary_list.append(CircuitBoundaryResponse(**boundary_dict))

        return boundary_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{circuit_id}/optimal-trajectory", response_model=list[OptimalTrajectoryPointResponse])
async def calculate_optimal_trajectory(circuit_id: str, db: DbSession = Depends(get_db)):
    """Calcule et sauvegarde la trajectoire optimale pour un circuit"""
    try:
        # Récupérer les bordures du circuit
        boundaries = db.query(sql_models.CircuitBoundary)\
            .filter(sql_models.CircuitBoundary.circuit_id == circuit_id)\
            .order_by(sql_models.CircuitBoundary.side, sql_models.CircuitBoundary.point_order)\
            .all()

        if not boundaries:
            raise HTTPException(status_code=404, detail="Aucune bordure trouvée pour ce circuit")

        # Séparer les bordures gauche et droite
        left_boundary = [b for b in boundaries if b.side == 'left']
        right_boundary = [b for b in boundaries if b.side == 'right']

        if not left_boundary or not right_boundary:
            raise HTTPException(status_code=400, detail="Les bordures gauche et droite sont requises")

        # Calculer la trajectoire optimale de manière asynchrone
        import asyncio
        from concurrent.futures import ThreadPoolExecutor

        def compute_trajectory():
            optimizer = TrajectoryOptimizer()
            return optimizer.calculate_optimal_trajectory(left_boundary, right_boundary)

        # Exécuter le calcul dans un thread séparé pour ne pas bloquer
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            trajectory_points = await loop.run_in_executor(executor, compute_trajectory)

        # Supprimer l'ancienne trajectoire si elle existe
        db.query(sql_models.OptimalTrajectory)\
            .filter(sql_models.OptimalTrajectory.circuit_id == circuit_id)\
            .delete()

        # Sauvegarder la nouvelle trajectoire
        trajectory_list = []
        for i, (x, y) in enumerate(trajectory_points):
            trajectory = sql_models.OptimalTrajectory(
                circuit_id=circuit_id,
                point_order=i,
                x=x,
                y=y
            )
            db.add(trajectory)
            db.flush()

            trajectory_dict = {
                "id": str(trajectory.id),
                "circuit_id": str(trajectory.circuit_id),
                "point_order": trajectory.point_order,
                "x": float(trajectory.x),
                "y": float(trajectory.y),
                "created_at": trajectory.created_at.isoformat() if trajectory.created_at else ""
            }
            trajectory_list.append(OptimalTrajectoryPointResponse(**trajectory_dict))

        db.commit()
        return trajectory_list

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{circuit_id}/optimal-trajectory", response_model=list[OptimalTrajectoryPointResponse])
async def get_optimal_trajectory(circuit_id: str, db: DbSession = Depends(get_db)):
    """Récupère la trajectoire optimale d'un circuit"""
    try:
        trajectory = db.query(sql_models.OptimalTrajectory)\
            .filter(sql_models.OptimalTrajectory.circuit_id == circuit_id)\
            .order_by(sql_models.OptimalTrajectory.point_order)\
            .all()

        if not trajectory:
            raise HTTPException(status_code=404, detail="Aucune trajectoire optimale trouvée")

        trajectory_list = []
        for point in trajectory:
            point_dict = {
                "id": str(point.id),
                "circuit_id": str(point.circuit_id),
                "point_order": point.point_order,
                "x": float(point.x),
                "y": float(point.y),
                "created_at": point.created_at.isoformat() if point.created_at else ""
            }
            trajectory_list.append(OptimalTrajectoryPointResponse(**point_dict))

        return trajectory_list

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{circuit_id}/trajectory-comparison/{session_id}", response_model=TrajectoryComparisonResponse)
async def compare_trajectories(circuit_id: str, session_id: str, db: DbSession = Depends(get_db)):
    """Compare la trajectoire réelle d'une session avec la trajectoire optimale"""
    try:
        # Récupérer la trajectoire optimale
        optimal_trajectory = db.query(sql_models.OptimalTrajectory)\
            .filter(sql_models.OptimalTrajectory.circuit_id == circuit_id)\
            .order_by(sql_models.OptimalTrajectory.point_order)\
            .all()

        if not optimal_trajectory:
            raise HTTPException(status_code=404, detail="Aucune trajectoire optimale trouvée")

        # Récupérer la trajectoire réelle
        actual_trajectory = db.query(sql_models.SensorData)\
            .filter(sql_models.SensorData.session_id == session_id)\
            .filter(sql_models.SensorData.uwb_x.isnot(None))\
            .filter(sql_models.SensorData.uwb_y.isnot(None))\
            .order_by(sql_models.SensorData.timestamp)\
            .all()

        if not actual_trajectory:
            raise HTTPException(status_code=404, detail="Aucune trajectoire réelle trouvée")

        # Préparer les données
        optimal_points = [(float(p.x), float(p.y)) for p in optimal_trajectory]
        actual_points = [(float(p.uwb_x), float(p.uwb_y)) for p in actual_trajectory]

        # Calculer les statistiques de déviation
        optimizer = TrajectoryOptimizer()
        deviation_stats = optimizer.calculate_deviation(actual_points, optimal_points)

        # Formater les trajectoires pour la réponse
        optimal_formatted = [{"x": x, "y": y} for x, y in optimal_points]
        actual_formatted = [{"x": x, "y": y, "timestamp": p.timestamp} for (x, y), p in zip(actual_points, actual_trajectory)]

        return TrajectoryComparisonResponse(
            session_id=session_id,
            optimal_trajectory=optimal_formatted,
            actual_trajectory=actual_formatted,
            deviation_stats=deviation_stats
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/week-circuit/simulation-data")
async def get_week_circuit_simulation_data(db: DbSession = Depends(get_db)):
    """Récupère les données de simulation pour le circuit Week"""
    try:
        # Récupérer le circuit Week par son nom
        week_circuit = db.query(sql_models.Circuit)\
            .filter(sql_models.Circuit.name == "Week Circuit")\
            .first()

        if not week_circuit:
            raise HTTPException(status_code=404, detail="Circuit Week non trouvé")

        circuit_id = str(week_circuit.id)

        # Récupérer les bordures du circuit
        boundaries = db.query(sql_models.CircuitBoundary)\
            .filter(sql_models.CircuitBoundary.circuit_id == circuit_id)\
            .order_by(sql_models.CircuitBoundary.side, sql_models.CircuitBoundary.point_order)\
            .all()

        # Récupérer la trajectoire optimale
        optimal_trajectory = db.query(sql_models.OptimalTrajectory)\
            .filter(sql_models.OptimalTrajectory.circuit_id == circuit_id)\
            .order_by(sql_models.OptimalTrajectory.point_order)\
            .all()

        # Si pas de trajectoire optimale, la calculer de manière asynchrone
        if not optimal_trajectory:
            left_boundary = [b for b in boundaries if b.side == 'left']
            right_boundary = [b for b in boundaries if b.side == 'right']

            if not left_boundary or not right_boundary:
                raise HTTPException(status_code=400, detail="Les bordures du circuit sont incomplètes")

            # Calculer la trajectoire optimale de manière asynchrone
            import asyncio
            from concurrent.futures import ThreadPoolExecutor

            def compute_trajectory():
                optimizer = TrajectoryOptimizer()
                return optimizer.calculate_optimal_trajectory(left_boundary, right_boundary)

            # Exécuter le calcul dans un thread séparé pour ne pas bloquer
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                trajectory_points = await loop.run_in_executor(executor, compute_trajectory)

            # Formater les données
            optimal_trajectory_formatted = [{"x": x, "y": y, "point_order": i} for i, (x, y) in enumerate(trajectory_points)]
        else:
            optimal_trajectory_formatted = [{"x": float(p.x), "y": float(p.y), "point_order": p.point_order} for p in optimal_trajectory]

        # Formater les bordures
        boundaries_formatted = []
        for boundary in boundaries:
            boundaries_formatted.append({
                "id": str(boundary.id),
                "side": boundary.side,
                "point_order": boundary.point_order,
                "x": float(boundary.x),
                "y": float(boundary.y)
            })

        return {
            "circuit": {
                "id": circuit_id,
                "name": week_circuit.name,
                "description": week_circuit.description
            },
            "boundaries": boundaries_formatted,
            "optimal_trajectory": optimal_trajectory_formatted
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
