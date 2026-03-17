from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.course import Course
from models.course_assistant import CourseAssistant, CourseAssistantInvite
from models.enums import UserRole
from models.user import User


class AssistantService:
    invite_ttl_minutes = 30

    @staticmethod
    def create_invite(db: Session, course_id: int, teacher: User) -> CourseAssistantInvite:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if teacher.role != UserRole.admin and course.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Cannot manage assistants for this course")

        invite = CourseAssistantInvite(
            course_id=course_id,
            teacher_id=course.teacher_id,
            code=secrets.token_hex(4).upper(),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=AssistantService.invite_ttl_minutes),
        )
        db.add(invite)
        db.commit()
        db.refresh(invite)
        return invite

    @staticmethod
    def consume_invite(db: Session, code: str, student: User) -> CourseAssistant:
        if student.role != UserRole.student:
            raise HTTPException(status_code=403, detail="Only students can become assistants")

        invite = (
            db.query(CourseAssistantInvite)
            .filter(CourseAssistantInvite.code == code.upper())
            .first()
        )
        if not invite:
            raise HTTPException(status_code=404, detail="Assistant code not found")
        if invite.used_at is not None or invite.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Assistant code expired or already used")

        existing = (
            db.query(CourseAssistant)
            .filter(CourseAssistant.course_id == invite.course_id, CourseAssistant.student_id == student.id)
            .first()
        )
        if existing:
            invite.used_at = datetime.now(timezone.utc)
            db.commit()
            return existing

        link = CourseAssistant(
            course_id=invite.course_id,
            teacher_id=invite.teacher_id,
            student_id=student.id,
        )
        invite.used_at = datetime.now(timezone.utc)
        db.add(link)
        db.commit()
        db.refresh(link)
        return link
