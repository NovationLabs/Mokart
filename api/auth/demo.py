import os

DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440001"
DEMO_EMAIL = "demo@mokart.com"
DEMO_ROLE = "driver"


def demo_enabled() -> bool:
    return os.getenv("DEMO_MODE", "false").lower() in ("1", "true", "yes")
