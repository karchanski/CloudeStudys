from __future__ import annotations

import httpx

from api.config import settings


class TelegramService:
    @staticmethod
    def send_message(telegram_id: str, text: str) -> bool:
        token = settings.telegram_bot_token
        if not token or token == "CHANGE_ME":
            return False

        response = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": telegram_id, "text": text},
            timeout=10,
        )
        return response.is_success
