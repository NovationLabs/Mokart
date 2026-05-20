import os
import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/installer", tags=["installer"])

class AuthRequest(BaseModel):
    hash: str

@router.post("/authkey")
def get_authkey(payload: AuthRequest):
    expected = os.getenv("INSTALL_PASSWORD_HASH", "")
    authkey  = os.getenv("HEADSCALE_AUTHKEY", "")

    if not expected or not authkey:
        raise HTTPException(503, "Installer not configured on this server")

    if not hashlib.compare_digest(payload.hash, expected):
        raise HTTPException(403, "Invalid password")

    return {"authkey": authkey}
