from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class Session(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    kart: Optional[str] = None
    circuit_id: Optional[UUID] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

class TrajectoryPoint(BaseModel):
    x: float
    y: float
    timestamp: int
    steering_angle: Optional[float] = None

class OptimalTrajectoryPoint(BaseModel):
    id: str
    circuit_id: str
    point_order: int
    x: float
    y: float
    created_at: str

class TrajectoryComparison(BaseModel):
    session_id: str
    optimal_trajectory: List[TrajectoryPoint]
    actual_trajectory: List[TrajectoryPoint]
    deviation_stats: dict

class HudFrame(BaseModel):
    """Une frame prête à afficher pour le HUD téléphone.

    Contrat unique partagé entre le replay MVP (dérivé d'une session
    enregistrée) et le futur flux live poussé par le RPi. Le front ne
    connaît que ce format — voir app/src/hooks/useTelemetryFrames.ts.
    """
    t: float                 # temps écoulé depuis le début de la session (s)
    speed: float             # km/h
    gx: float                # G latéral
    gy: float                # G longitudinal
    delta: Optional[float] = None   # écart vs tour de référence (s), None au 1er tour
    lap: int                 # numéro du tour courant (1-indexé)
    lap_time: float          # temps du tour courant (s)
    sector: int              # 1, 2 ou 3
    x: float                 # position (repère circuit)
    y: float

class HudSession(BaseModel):
    """Enveloppe renvoyée par GET /sessions/{id}/hud-frames."""
    session_id: str
    kart: Optional[str] = None
    circuit_id: Optional[str] = None
    dt_s: float                       # période de lecture recommandée (s)
    bounds: dict                      # min/max x/y pour l'auto-échelle du tracé
    best_lap: Optional[float] = None  # meilleur tour détecté (s)
    track: List[List[float]] = []     # tracé unique lissé du circuit (moyenne des tours)
    frames: List[HudFrame]
