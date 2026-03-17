from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class HomeworkSubmissionOut(BaseModel):
    submission_id: int
    homework_id: int
    homework_title: str
    course_id: int
    course_name: str
    student_id: int
    student_name: str
    file_url: str
    submitted_at: datetime
    reviewer_id: int | None
    grade: float | None
    feedback: str | None
    graded_at: datetime | None


class HomeworkSubmissionReviewRequest(BaseModel):
    grade: float | None = None
    feedback: str | None = None
