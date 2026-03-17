from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class AssistantInviteOut(BaseModel):
    code: str
    course_id: int
    expires_at: datetime


class AssistantLinkRequest(BaseModel):
    code: str


class CourseAssistantOut(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    linked_at: datetime


class CourseWorkspaceOut(BaseModel):
    course_id: int
    course_name: str
    google_sheet_url: str | None
    moodle_id: str | None


class UpdateCourseWorkspaceRequest(BaseModel):
    google_sheet_url: str | None = None
