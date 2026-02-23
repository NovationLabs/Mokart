from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class Session(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    kart: Optional[str] = None
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
