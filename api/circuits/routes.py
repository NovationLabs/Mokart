from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session as DbSession
from config.database import get_db
from models import sql_models
from pydantic import BaseModel
import uuid

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
