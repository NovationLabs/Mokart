import uuid
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session as DbSession

from config.database import get_db
from .tokens import decode_access_token
from .demo import DEMO_ROLE, demo_enabled

ALL_ROLES = {"admin", "track_manager", "commissaire", "commissaire_piste", "mechanic", "instructor", "driver", "spectator", "device_kart"}
DB_ROLES = {"admin", "commissaire", "mechanic", "instructor", "driver", "spectator"}
STAFF_ROLES = {"admin", "track_manager", "commissaire", "commissaire_piste", "mechanic", "instructor"}
ADMIN_ROLES = {"admin"}

bearer = HTTPBearer(auto_error=False)

UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentification requise",
    headers={"WWW-Authenticate": "Bearer"},
)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    role: str
    demo: bool = False

    @property
    def is_staff(self) -> bool:
        return self.role in STAFF_ROLES

    @property
    def is_admin(self) -> bool:
        return self.role in ADMIN_ROLES


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: DbSession = Depends(get_db),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UNAUTHORIZED
    try:
        claims = decode_access_token(credentials.credentials)
        user_id = str(uuid.UUID(claims["sub"]))
    except (jwt.PyJWTError, ValueError, KeyError):
        raise UNAUTHORIZED

    if claims.get("demo"):
        if not demo_enabled():
            raise UNAUTHORIZED
        return CurrentUser(id=user_id, role=DEMO_ROLE, demo=True)

    row = db.execute(
        text("SELECT role, is_active FROM users WHERE id = :id"),
        {"id": user_id},
    ).fetchone()
    if not row or row.is_active in (False, "false", "f"):
        raise UNAUTHORIZED
    return CurrentUser(id=user_id, role=row.role or "driver")


def require_roles(*roles: str):
    allowed = set(roles)

    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Droits insuffisants")
        return user

    return checker


require_admin = require_roles(*ADMIN_ROLES)
