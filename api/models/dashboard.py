from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class KartStatus(BaseModel):
    id: str
    name: str
    driver: Optional[str] = None
    battery_level: float
    status: str  # 'online', 'offline', 'charging', 'maintenance'
    last_seen: Optional[datetime] = None
    location: Optional[Dict[str, float]] = None

class ElectricalModule(BaseModel):
    kart_id: str
    module_type: str  # 'point_one', 'uwb', 'battery_controller'
    status: str
    battery_voltage: Optional[float] = None
    signal_strength: Optional[float] = None
    last_update: datetime
    data: Dict[str, Any]

class CircuitInfo(BaseModel):
    id: str
    name: str
    status: str  # 'active', 'inactive', 'maintenance'
    temperature: float
    humidity: float
    grip_level: str
    active_karts: int

class UserStats(BaseModel):
    total_laps: int
    best_lap_time: float
    avg_lap_time: float
    top_speed: float
    consistency: float
    last_session_date: Optional[datetime] = None

class SystemStatus(BaseModel):
    total_users: int
    active_sessions: int
    total_karts: int
    online_karts: int
    system_health: str  # 'good', 'warning', 'critical'
    last_backup: Optional[datetime] = None

class DashboardData(BaseModel):
    user_role: str  # 'admin', 'driver', 'mechanic', 'observer', 'commissaire_piste'
    user_stats: Optional[UserStats] = None
    karts_status: Optional[List[KartStatus]] = None
    electrical_modules: Optional[List[ElectricalModule]] = None
    circuit_info: Optional[CircuitInfo] = None
    system_status: Optional[SystemStatus] = None
    live_leaderboard: Optional[List[Dict[str, Any]]] = None
    live_stats: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None
    track_evolution: Optional[Dict[str, Any]] = None
    daily_highlights: Optional[List[Dict[str, Any]]] = None
