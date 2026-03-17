from __future__ import annotations

from collections import defaultdict


class SessionStore:
    def __init__(self) -> None:
        self.tokens = defaultdict(str)

    def set_token(self, telegram_id: int, token: str) -> None:
        self.tokens[telegram_id] = token

    def get_token(self, telegram_id: int) -> str | None:
        token = self.tokens.get(telegram_id)
        return token or None


store = SessionStore()
