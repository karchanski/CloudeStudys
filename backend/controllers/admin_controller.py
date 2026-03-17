from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.deps import require_role
from auth.security import hash_password
from database.session import get_db
from models.attendance import Attendance
from models.course import Course
from models.group import Group
from models.homework import Homework
from models.enums import UserRole
from models.notification import Notification
from models.user import User
from schemas.course import CourseOut, CreateCourseRequest, UpdateCourseRequest
from schemas.group import CreateGroupRequest, GroupWithStatsOut, UpdateGroupRequest
from schemas.user import CreateUserRequest, UpdateUserRequest, UserOut

router = APIRouter(prefix="/admin", tags=["Admin"])


def ensure_group_exists(db: Session, group_id: int | None) -> None:
    if group_id is None:
        return
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")


def ensure_teacher_exists(db: Session, teacher_id: int) -> None:
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if teacher.role not in (UserRole.teacher, UserRole.admin):
        raise HTTPException(status_code=400, detail="Selected user cannot be assigned as course teacher")


def ensure_course_exists(db: Session, course_id: int | None) -> None:
    if course_id is None:
        return
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")


@router.get("/users", response_model=list[UserOut])
def admin_users(
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.id.desc()).all()


@router.post("/users", response_model=UserOut)
def admin_create_user(
    payload: CreateUserRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    ensure_group_exists(db, payload.group_id)

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        group_id=payload.group_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: int,
    payload: UpdateUserRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    duplicate = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Email already exists")
    ensure_group_exists(db, payload.group_id)

    user.name = payload.name
    user.email = payload.email
    user.role = payload.role
    user.group_id = payload.group_id
    user.telegram_id = payload.telegram_id
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if db.query(Course.id).filter(Course.teacher_id == user_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete user assigned as teacher for existing courses")
    if db.query(Attendance.id).filter(Attendance.student_id == user_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete user with attendance records")
    if db.query(Notification.id).filter(Notification.user_id == user_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete user with notifications")
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


@router.get("/groups", response_model=list[GroupWithStatsOut])
def admin_groups(
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Group, Course.name, func.count(User.id))
        .outerjoin(Course, Course.id == Group.course_id)
        .outerjoin(User, User.group_id == Group.id)
        .group_by(Group.id, Course.name)
        .order_by(Group.name.asc())
        .all()
    )
    return [
        GroupWithStatsOut(
            id=group.id,
            name=group.name,
            course_id=group.course_id,
            course_name=course_name,
            student_count=student_count,
        )
        for group, course_name, student_count in rows
    ]


@router.post("/groups", response_model=GroupWithStatsOut)
def admin_create_group(
    payload: CreateGroupRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    existing = db.query(Group).filter(Group.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Group name already exists")
    ensure_course_exists(db, payload.course_id)

    group = Group(name=payload.name, course_id=payload.course_id)
    db.add(group)
    db.commit()
    db.refresh(group)
    course_name = db.query(Course.name).filter(Course.id == group.course_id).scalar()
    return GroupWithStatsOut(
        id=group.id,
        name=group.name,
        course_id=group.course_id,
        course_name=course_name,
        student_count=0,
    )


@router.put("/groups/{group_id}", response_model=GroupWithStatsOut)
def admin_update_group(
    group_id: int,
    payload: UpdateGroupRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    duplicate = db.query(Group).filter(Group.name == payload.name, Group.id != group_id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Group name already exists")
    ensure_course_exists(db, payload.course_id)

    group.name = payload.name
    group.course_id = payload.course_id
    db.commit()
    db.refresh(group)
    course_name = db.query(Course.name).filter(Course.id == group.course_id).scalar()
    student_count = db.query(func.count(User.id)).filter(User.group_id == group.id).scalar() or 0
    return GroupWithStatsOut(
        id=group.id,
        name=group.name,
        course_id=group.course_id,
        course_name=course_name,
        student_count=student_count,
    )


@router.delete("/groups/{group_id}")
def admin_delete_group(
    group_id: int,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.query(User).filter(User.group_id == group_id).update({User.group_id: None})
    db.delete(group)
    db.commit()
    return {"status": "deleted"}


@router.get("/courses", response_model=list[CourseOut])
def admin_courses(
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    return db.query(Course).order_by(Course.id.desc()).all()


@router.post("/courses", response_model=CourseOut)
def admin_create_course(
    payload: CreateCourseRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    ensure_teacher_exists(db, payload.teacher_id)
    course = Course(name=payload.name, teacher_id=payload.teacher_id, moodle_id=payload.moodle_id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.post("/create-course", response_model=CourseOut)
def admin_create_course_legacy(
    payload: CreateCourseRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    ensure_teacher_exists(db, payload.teacher_id)
    course = Course(name=payload.name, teacher_id=payload.teacher_id, moodle_id=payload.moodle_id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/courses/{course_id}", response_model=CourseOut)
def admin_update_course(
    course_id: int,
    payload: UpdateCourseRequest,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    ensure_teacher_exists(db, payload.teacher_id)
    course.name = payload.name
    course.teacher_id = payload.teacher_id
    course.moodle_id = payload.moodle_id
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
def admin_delete_course(
    course_id: int,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if db.query(Attendance.id).filter(Attendance.course_id == course_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete course with attendance records")
    if db.query(Homework.id).filter(Homework.course_id == course_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete course with homework")
    db.query(Group).filter(Group.course_id == course_id).update({Group.course_id: None})
    db.delete(course)
    db.commit()
    return {"status": "deleted"}
