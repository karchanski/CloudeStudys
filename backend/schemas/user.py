from __future__ import annotations

from pydantic import BaseModel, EmailStr

from models.enums import UserRole


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    group_id: int | None
    telegram_id: str | None

    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    group_id: int | None = None


class UpdateUserRequest(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    group_id: int | None = None
    telegram_id: str | None = None
