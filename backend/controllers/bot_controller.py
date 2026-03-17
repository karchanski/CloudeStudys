from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.session import get_db
from models.group import Group
from models.homework import Homework
from models.user import User

router = APIRouter(prefix="/bot", tags=["Bot"])


@router.get("/student/courses/{telegram_id}")
def bot_student_courses(telegram_id: str, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not linked")
    if not student.group_id:
        return []
    group = db.query(Group).filter(Group.id == student.group_id).first()
    if not group or not group.course_id:
        return []
    return [{"id": group.course_id, "name": f"Course #{group.course_id}"}]


@router.get("/student/homework/{telegram_id}")
def bot_student_homework(telegram_id: str, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not linked")
    if not student.group_id:
        return []
    group = db.query(Group).filter(Group.id == student.group_id).first()
    if not group or not group.course_id:
        return []
    rows = db.query(Homework).filter(Homework.course_id == group.course_id).order_by(Homework.created_at.desc()).all()
    return [{"id": item.id, "title": item.title} for item in rows]
