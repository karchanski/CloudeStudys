from __future__ import annotations

from pydantic import BaseModel


class CourseOut(BaseModel):
    id: int
    name: str
    teacher_id: int
    moodle_id: str | None

    class Config:
        from_attributes = True


class CreateCourseRequest(BaseModel):
    name: str
    teacher_id: int
    moodle_id: str | None = None


class UpdateCourseRequest(BaseModel):
    name: str
    teacher_id: int
    moodle_id: str | None = None


class TeacherCourseOut(BaseModel):
    id: int
    name: str
    teacher_id: int
    teacher_name: str
    moodle_id: str | None
    group_names: list[str]
    student_count: int
    attendance_rate: float


class StudentCourseOut(BaseModel):
    id: int
    name: str
    teacher_id: int
    teacher_name: str | None
    moodle_id: str | None
    group_id: int | None
    group_name: str | None
