from __future__ import annotations

from pydantic import BaseModel, EmailStr


class StudentProfileOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    group_id: int | None
    group_name: str | None
    telegram_id: str | None
    courses_count: int
    homework_count: int
    attendance_percent: float
    notifications_count: int
    assistant_courses_count: int = 0
