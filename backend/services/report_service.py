from io import BytesIO

from openpyxl import Workbook
from sqlalchemy.orm import Session

from models.attendance import Attendance
from models.course import Course
from models.user import User


class ReportService:
    @staticmethod
    def attendance_report_xlsx(db: Session, teacher_id: int) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "Attendance"
        ws.append(["Student", "Course", "Date", "Status"])

        rows = (
            db.query(User.name, Course.name, Attendance.date, Attendance.status)
            .join(Attendance, Attendance.student_id == User.id)
            .join(Course, Attendance.course_id == Course.id)
            .filter(Course.teacher_id == teacher_id)
            .all()
        )

        for student_name, course_name, date, status in rows:
            ws.append([student_name, course_name, str(date), status.value])

        buffer = BytesIO()
        wb.save(buffer)
        return buffer.getvalue()
