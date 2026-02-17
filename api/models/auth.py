from typing import Optional
from pydantic import BaseModel

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
