from datetime import date

from pydantic import BaseModel

from models.enums import AttendanceStatus


class MarkAttendanceItem(BaseModel):
    student_id: int
    course_id: int
    date: date
    status: AttendanceStatus


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    date: date
    status: AttendanceStatus

    class Config:
        from_attributes = True


class CourseStudentAttendanceOut(BaseModel):
    student_id: int
    student_name: str
    group_id: int | None
    group_name: str | None
    status: AttendanceStatus | None


class StudentAttendanceOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    course_name: str
    date: date
    status: AttendanceStatus
