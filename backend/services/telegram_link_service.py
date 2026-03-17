from __future__ import annotations

import secrets
import time


class TelegramLinkService:
    _codes: dict[str, tuple[int, float]] = {}
    ttl_seconds = 600

    @classmethod
    def create_code(cls, user_id: int) -> tuple[str, int]:
        now = time.time()
        cls._cleanup(now)
        code = secrets.token_hex(3).upper()
        cls._codes[code] = (user_id, now + cls.ttl_seconds)
        return code, cls.ttl_seconds

    @classmethod
    def consume_code(cls, code: str) -> int | None:
        now = time.time()
        cls._cleanup(now)
        payload = cls._codes.pop(code.upper(), None)
        if not payload:
            return None
        user_id, expires_at = payload
        if expires_at < now:
            return None
        return user_id

    @classmethod
    def _cleanup(cls, now: float) -> None:
        expired = [code for code, (_, expires_at) in cls._codes.items() if expires_at < now]
        for code in expired:
            cls._codes.pop(code, None)
