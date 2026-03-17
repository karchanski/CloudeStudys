from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class MoodleSyncLogOut(BaseModel):
    started_at: datetime
    finished_at: datetime | None
    status: str
    synced: int
    message: str


class MoodleStatusOut(BaseModel):
    base_url: str
    auth_mode: str
    has_token: bool
    has_credentials: bool
    last_sync: MoodleSyncLogOut | None
    recent_logs: list[MoodleSyncLogOut]


class MoodleConnectionOut(BaseModel):
    ok: bool
    message: str
