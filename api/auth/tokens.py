import datetime
import logging
import os
import secrets

import jwt

ALGORITHM = "HS256"
ACCESS_TTL = datetime.timedelta(hours=12)

_secret = os.getenv("SECRET_KEY")
if not _secret or len(_secret) < 32 or _secret.startswith("change-me"):
    _secret = secrets.token_urlsafe(48)
    logging.getLogger("mokart.auth").warning(
        "SECRET_KEY absente ou trop courte, clé temporaire générée : les sessions sautent à chaque redémarrage"
    )
SECRET_KEY = _secret


def create_access_token(user_id: str, role: str, demo: bool = False) -> dict:
    now = datetime.datetime.now(datetime.timezone.utc)
    expires = now + ACCESS_TTL
    payload = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
        "jti": secrets.token_urlsafe(12),
    }
    if demo:
        payload["demo"] = True
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "expires_at": expires.timestamp()}


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["sub", "exp"]})
