import base64
import hashlib
import hmac
import os

SCRYPT_N = 2 ** 14
SCRYPT_R = 8
SCRYPT_P = 1
PREFIX = "scrypt"


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=32)
    return f"{PREFIX}${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64(salt)}${_b64(digest)}"


def _is_legacy_sha256(stored: str) -> bool:
    return len(stored) == 64 and all(c in "0123456789abcdef" for c in stored)


def verify_password(password: str, stored: str) -> bool:
    if not stored:
        return False
    if stored.startswith(PREFIX + "$"):
        try:
            _, n, r, p, salt, digest = stored.split("$")
            candidate = hashlib.scrypt(
                password.encode(),
                salt=base64.b64decode(salt),
                n=int(n),
                r=int(r),
                p=int(p),
                dklen=len(base64.b64decode(digest)),
            )
        except (ValueError, TypeError):
            return False
        return hmac.compare_digest(candidate, base64.b64decode(digest))
    if _is_legacy_sha256(stored):
        return hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(), stored)
    return False


def needs_rehash(stored: str) -> bool:
    return not stored.startswith(f"{PREFIX}${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}$")


def check_strength(password: str) -> None:
    if len(password) < 10:
        raise ValueError("Le mot de passe doit faire au moins 10 caractères")
    if len(password) > 256:
        raise ValueError("Le mot de passe est trop long")
