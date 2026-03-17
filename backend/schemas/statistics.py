from pydantic import BaseModel


class CourseAttendanceStat(BaseModel):
    course_id: int
    course_name: str
    present_percent: float
    absent_percent: float
    late_percent: float
