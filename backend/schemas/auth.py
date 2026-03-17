from __future__ import annotations

from pydantic import BaseModel, EmailStr

from models.enums import UserRole
from schemas.user import UserOut


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    group_id: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MoodleLoginRequest(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.teacher


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TelegramLinkRequest(BaseModel):
    code: str
    telegram_id: str


class TelegramLinkCodeOut(BaseModel):
    code: str
    expires_in_seconds: int


class AuthSession(BaseModel):
    user: UserOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutOut(BaseModel):
    status: str


class RefreshSessionOut(BaseModel):
    id: int
    created_at: str
    expires_at: str
    last_seen_at: str | None = None
    user_agent: str | None = None
    ip_address: str | None = None
    revoked: bool
    is_current: bool


class LogoutAllOut(BaseModel):
    status: str
    revoked_sessions: int
