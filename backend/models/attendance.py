from sqlalchemy import Column, Integer, Date, ForeignKey, Enum, UniqueConstraint

from database.session import Base
from models.enums import AttendanceStatus


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "course_id", "date", name="uq_attendance_record"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False)
