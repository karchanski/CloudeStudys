import os

import httpx


class BackendClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("API_BASE_URL", "http://localhost:8000")

    async def list_student_courses(self, telegram_id: int):
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(f"{self.base_url}/bot/student/courses/{telegram_id}")
            r.raise_for_status()
            return r.json()

    async def list_student_homework(self, telegram_id: int):
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(f"{self.base_url}/bot/student/homework/{telegram_id}")
            r.raise_for_status()
            return r.json()

    async def link_telegram(self, code: str, telegram_id: int):
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(f"{self.base_url}/auth/telegram/link", json={"code": code, "telegram_id": str(telegram_id)})
            r.raise_for_status()
            return r.json()
