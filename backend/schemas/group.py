from __future__ import annotations

from pydantic import BaseModel


class GroupOut(BaseModel):
    id: int
    name: str
    course_id: int | None

    class Config:
        from_attributes = True


class GroupWithStatsOut(BaseModel):
    id: int
    name: str
    course_id: int | None
    course_name: str | None
    student_count: int


class CreateGroupRequest(BaseModel):
    name: str
    course_id: int | None = None


class UpdateGroupRequest(BaseModel):
    name: str
    course_id: int | None = None
