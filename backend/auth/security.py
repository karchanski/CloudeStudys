from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets

from jose import jwt
from passlib.context import CryptContext

from api.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _create_token(
    subject: str,
    minutes: int | None = None,
    days: int | None = None,
    token_type: str = "access",
    jti: str | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    if minutes is not None:
        exp = now + timedelta(minutes=minutes)
    elif days is not None:
        exp = now + timedelta(days=days)
    else:
        raise ValueError("Either minutes or days must be provided")

    payload = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": jti or secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(subject, minutes=settings.jwt_access_expire_minutes, token_type="access")


def create_refresh_token(subject: str, jti: str) -> str:
    return _create_token(subject, days=settings.jwt_refresh_expire_days, token_type="refresh", jti=jti)
