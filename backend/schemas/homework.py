from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class HomeworkOut(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    file_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherHomeworkOut(BaseModel):
    id: int
    course_id: int
    course_name: str
    title: str
    description: str
    file_url: str | None
    created_at: datetime


class StudentHomeworkOut(BaseModel):
    id: int
    course_id: int
    course_name: str
    title: str
    description: str
    file_url: str | None
    created_at: datetime
    submission_id: int | None = None
    submission_file_url: str | None = None
    submitted_at: datetime | None = None
    grade: float | None = None
    feedback: str | None = None
    graded_at: datetime | None = None
