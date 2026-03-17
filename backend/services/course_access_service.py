from __future__ import annotations

from sqlalchemy.orm import Session

from models.course import Course
from models.course_assistant import CourseAssistant
from models.enums import UserRole
from models.user import User


class CourseAccessService:
    @staticmethod
    def can_manage_course(db: Session, user: User, course_id: int) -> bool:
        if user.role == UserRole.admin:
            return True

        if user.role == UserRole.teacher:
            return (
                db.query(Course.id)
                .filter(Course.id == course_id, Course.teacher_id == user.id)
                .first()
                is not None
            )

        if user.role == UserRole.student:
            return (
                db.query(CourseAssistant.id)
                .filter(CourseAssistant.course_id == course_id, CourseAssistant.student_id == user.id)
                .first()
                is not None
            )

        return False
