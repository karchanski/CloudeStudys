from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.deps import require_role
from database.session import get_db
from models.attendance import Attendance
from models.course_assistant import CourseAssistant
from models.course import Course
from models.group import Group
from models.enums import AttendanceStatus, UserRole
from models.homework import Homework, HomeworkSubmission
from models.homework_review import HomeworkReview
from models.notification import Notification
from models.user import User
from schemas.assistant import AssistantLinkRequest
from schemas.attendance import StudentAttendanceOut
from schemas.course import StudentCourseOut
from schemas.homework import StudentHomeworkOut
from schemas.notification import NotificationOut
from schemas.student import StudentProfileOut
from services.assistant_service import AssistantService
from services.homework_service import HomeworkService

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/profile", response_model=StudentProfileOut)
def student_profile(
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == current_user.group_id).first() if current_user.group_id else None
    course_ids = [course_id for (course_id,) in db.query(Course.id).join(Group, Group.course_id == Course.id).filter(Group.id == current_user.group_id).all()] if current_user.group_id else []
    attendance_rows = db.query(Attendance).filter(Attendance.student_id == current_user.id).all()
    present_count = sum(1 for row in attendance_rows if row.status == AttendanceStatus.present)
    attendance_percent = round((present_count / len(attendance_rows)) * 100, 2) if attendance_rows else 0.0
    homework_count = (
        db.query(func.count(Homework.id))
        .filter(Homework.course_id.in_(course_ids))  # type: ignore[arg-type]
        .scalar()
        if course_ids
        else 0
    ) or 0
    notifications_count = db.query(func.count(Notification.id)).filter(Notification.user_id == current_user.id).scalar() or 0
    assistant_courses_count = db.query(func.count(CourseAssistant.id)).filter(CourseAssistant.student_id == current_user.id).scalar() or 0

    return StudentProfileOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        group_id=current_user.group_id,
        group_name=group.name if group else None,
        telegram_id=current_user.telegram_id,
        courses_count=len(course_ids),
        homework_count=homework_count,
        attendance_percent=attendance_percent,
        notifications_count=notifications_count,
        assistant_courses_count=assistant_courses_count,
    )


@router.post("/assistant/link")
def student_link_assistant(
    payload: AssistantLinkRequest,
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    link = AssistantService.consume_invite(db, payload.code, current_user)
    return {"status": "linked", "course_id": link.course_id}


@router.get("/courses", response_model=list[StudentCourseOut])
def student_courses(
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(Group.id == current_user.group_id).first() if current_user.group_id else None
    query = db.query(Course, User.name).outerjoin(User, User.id == Course.teacher_id)

    if group and group.course_id:
        query = query.filter(Course.id == group.course_id)

    rows = query.order_by(Course.name.asc()).all()
    return [
        StudentCourseOut(
            id=course.id,
            name=course.name,
            teacher_id=course.teacher_id,
            teacher_name=teacher_name,
            moodle_id=course.moodle_id,
            group_id=group.id if group else None,
            group_name=group.name if group else None,
        )
        for course, teacher_name in rows
    ]


@router.get("/attendance", response_model=list[StudentAttendanceOut])
def student_attendance(
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Attendance, Course.name)
        .join(Course, Course.id == Attendance.course_id)
        .filter(Attendance.student_id == current_user.id)
        .order_by(Attendance.date.desc())
        .all()
    )
    return [
        StudentAttendanceOut(
            id=attendance.id,
            student_id=attendance.student_id,
            course_id=attendance.course_id,
            course_name=course_name,
            date=attendance.date,
            status=attendance.status,
        )
        for attendance, course_name in rows
    ]


@router.get("/homework", response_model=list[StudentHomeworkOut])
def student_homework(
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            Homework,
            Course.name,
            HomeworkSubmission.id,
            HomeworkSubmission.file_url,
            HomeworkSubmission.submitted_at,
            HomeworkReview.grade,
            HomeworkReview.feedback,
            HomeworkReview.graded_at,
        )
        .join(Course, Course.id == Homework.course_id)
        .outerjoin(
            HomeworkSubmission,
            (HomeworkSubmission.homework_id == Homework.id) & (HomeworkSubmission.student_id == current_user.id),
        )
        .outerjoin(HomeworkReview, HomeworkReview.submission_id == HomeworkSubmission.id)
    )
    group = db.query(Group).filter(Group.id == current_user.group_id).first() if current_user.group_id else None
    if group and group.course_id:
        q = q.filter(Homework.course_id == group.course_id)
    rows = q.order_by(Homework.created_at.desc()).all()
    return [
        StudentHomeworkOut(
            id=homework.id,
            course_id=homework.course_id,
            course_name=course_name,
            title=homework.title,
            description=homework.description,
            file_url=homework.file_url,
            created_at=homework.created_at,
            submission_id=submission_id,
            submission_file_url=submission_file_url,
            submitted_at=submitted_at,
            grade=float(grade) if grade is not None else None,
            feedback=feedback,
            graded_at=graded_at,
        )
        for homework, course_name, submission_id, submission_file_url, submitted_at, grade, feedback, graded_at in rows
    ]


@router.get("/notifications", response_model=list[NotificationOut])
def student_notifications(
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.post("/homework/{homework_id}/submit")
async def submit_homework(
    homework_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.student)),
    db: Session = Depends(get_db),
):
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    stored_file = await HomeworkService._store_file(file)
    if not stored_file:
        raise HTTPException(status_code=400, detail="File is required")

    submission = (
        db.query(HomeworkSubmission)
        .filter(HomeworkSubmission.homework_id == homework_id, HomeworkSubmission.student_id == current_user.id)
        .first()
    )
    if submission:
        HomeworkService._delete_file(submission.file_url)
        submission.file_url = stored_file
    else:
        submission = HomeworkSubmission(homework_id=homework_id, student_id=current_user.id, file_url=stored_file)
        db.add(submission)

    db.commit()
    db.refresh(submission)
    return {"status": "submitted", "submission_id": submission.id}
