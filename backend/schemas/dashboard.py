from pydantic import BaseModel


class DashboardSummaryOut(BaseModel):
    courses_count: int
    students_count: int
    homework_count: int
    attendance_rate_today: float
