from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from auth.deps import require_role
from database.session import get_db
from models.attendance import Attendance
from models.course_assistant import CourseAssistant
from models.course import Course
from models.enums import AttendanceStatus, UserRole
from models.group import Group
from models.homework import Homework, HomeworkSubmission
from models.homework_review import HomeworkReview
from models.course_workspace import CourseWorkspace
from models.user import User
from schemas.assistant import AssistantInviteOut, CourseAssistantOut, CourseWorkspaceOut, UpdateCourseWorkspaceRequest
from schemas.attendance import AttendanceOut, CourseStudentAttendanceOut, MarkAttendanceItem
from schemas.course import TeacherCourseOut
from schemas.dashboard import DashboardSummaryOut
from schemas.homework import HomeworkOut, TeacherHomeworkOut
from schemas.review import HomeworkSubmissionOut, HomeworkSubmissionReviewRequest
from schemas.statistics import CourseAttendanceStat
from services.assistant_service import AssistantService
from services.attendance_service import AttendanceService
from services.course_access_service import CourseAccessService
from services.google_sheets_service import GoogleSheetsService
from services.homework_service import HomeworkService
from services.notification_service import NotificationService
from services.report_service import ReportService

router = APIRouter(prefix="/teacher", tags=["Teacher"])


def _teacher_can_access_course(db: Session, current_user: User, course_id: int) -> bool:
    return CourseAccessService.can_manage_course(db, current_user, course_id)


def _teacher_homework_query(db: Session, current_user: User):
    q = db.query(Homework, Course.name).join(Course, Course.id == Homework.course_id)
    if current_user.role == UserRole.teacher:
        q = q.filter(Course.teacher_id == current_user.id)
    elif current_user.role == UserRole.student:
        q = q.join(CourseAssistant, CourseAssistant.course_id == Course.id).filter(CourseAssistant.student_id == current_user.id)
    return q


@router.get("/courses/{course_id}/workspace", response_model=CourseWorkspaceOut)
def course_workspace(
    course_id: int,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    if not _teacher_can_access_course(db, current_user, course_id):
        raise HTTPException(status_code=404, detail="Course not found or unavailable")
    course = db.query(Course).filter(Course.id == course_id).first()
    workspace = db.query(CourseWorkspace).filter(CourseWorkspace.course_id == course_id).first()
    return CourseWorkspaceOut(
        course_id=course.id,
        course_name=course.name,
        google_sheet_url=workspace.google_sheet_url if workspace else None,
        moodle_id=course.moodle_id,
    )


@router.put("/courses/{course_id}/workspace", response_model=CourseWorkspaceOut)
def update_course_workspace(
    course_id: int,
    payload: UpdateCourseWorkspaceRequest,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    if not _teacher_can_access_course(db, current_user, course_id):
        raise HTTPException(status_code=404, detail="Course not found or unavailable")
    course = db.query(Course).filter(Course.id == course_id).first()
    workspace = db.query(CourseWorkspace).filter(CourseWorkspace.course_id == course_id).first()
    if not workspace:
        workspace = CourseWorkspace(course_id=course_id, google_sheet_url=payload.google_sheet_url)
        db.add(workspace)
    else:
        workspace.google_sheet_url = payload.google_sheet_url
    db.commit()
    db.refresh(workspace)
    return CourseWorkspaceOut(
        course_id=course.id,
        course_name=course.name,
        google_sheet_url=workspace.google_sheet_url,
        moodle_id=course.moodle_id,
    )


@router.post("/courses/{course_id}/assistant-code", response_model=AssistantInviteOut)
def create_assistant_code(
    course_id: int,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    invite = AssistantService.create_invite(db, course_id, current_user)
    return AssistantInviteOut(code=invite.code, course_id=invite.course_id, expires_at=invite.expires_at)


@router.get("/courses/{course_id}/assistants", response_model=list[CourseAssistantOut])
def course_assistants(
    course_id: int,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    if not _teacher_can_access_course(db, current_user, course_id):
        raise HTTPException(status_code=404, detail="Course not found or unavailable")
    rows = (
        db.query(CourseAssistant, User.name, User.email)
        .join(User, User.id == CourseAssistant.student_id)
        .filter(CourseAssistant.course_id == course_id)
        .order_by(User.name.asc())
        .all()
    )
    return [
        CourseAssistantOut(
            student_id=assistant.student_id,
            student_name=student_name,
            student_email=student_email,
            linked_at=assistant.linked_at,
        )
        for assistant, student_name, student_email in rows
    ]


@router.get("/dashboard", response_model=DashboardSummaryOut)
def teacher_dashboard(
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    course_query = db.query(Course)
    if current_user.role == UserRole.teacher:
        course_query = course_query.filter(Course.teacher_id == current_user.id)

    courses = course_query.all()
    course_ids = [course.id for course in courses]

    student_count = 0
    if course_ids:
        student_count = (
            db.query(func.count(User.id))
            .join(Group, Group.id == User.group_id)
            .filter(
                Group.course_id.in_(course_ids),  # type: ignore[arg-type]
                User.role == UserRole.student,
            )
            .scalar()
            or 0
        )

    homework_query = db.query(func.count(Homework.id))
    attendance_query = db.query(
        func.count(Attendance.id),
        func.sum(case((Attendance.status == AttendanceStatus.present, 1), else_=0)),
    )
    if course_ids:
        homework_query = homework_query.filter(Homework.course_id.in_(course_ids))  # type: ignore[arg-type]
        attendance_query = attendance_query.filter(Attendance.course_id.in_(course_ids))  # type: ignore[arg-type]
    else:
        homework_query = homework_query.filter(False)
        attendance_query = attendance_query.filter(False)

    homework_count = homework_query.scalar() or 0
    today_total, today_present = attendance_query.filter(Attendance.date == date.today()).first() or (0, 0)
    attendance_rate_today = round(((today_present or 0) / (today_total or 1)) * 100, 2) if today_total else 0.0

    return DashboardSummaryOut(
        courses_count=len(courses),
        students_count=student_count,
        homework_count=homework_count,
        attendance_rate_today=attendance_rate_today,
    )


@router.get("/courses", response_model=list[TeacherCourseOut])
def teacher_courses(
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    course_query = db.query(Course, User.name).join(User, User.id == Course.teacher_id)
    if current_user.role == UserRole.teacher:
        course_query = course_query.filter(Course.teacher_id == current_user.id)

    results: list[TeacherCourseOut] = []
    for course, teacher_name in course_query.order_by(Course.name.asc()).all():
        groups = db.query(Group).filter(Group.course_id == course.id).order_by(Group.name.asc()).all()
        group_ids = [group.id for group in groups]
        student_count = 0
        if group_ids:
            student_count = (
                db.query(func.count(User.id))
                .filter(
                    User.group_id.in_(group_ids),  # type: ignore[arg-type]
                    User.role == UserRole.student,
                )
                .scalar()
                or 0
            )

        attendance_total, present_total = (
            db.query(
                func.count(Attendance.id),
                func.sum(case((Attendance.status == AttendanceStatus.present, 1), else_=0)),
            )
            .filter(Attendance.course_id == course.id)
            .first()
            or (0, 0)
        )
        attendance_rate = round(((present_total or 0) / (attendance_total or 1)) * 100, 2) if attendance_total else 0.0

        results.append(
            TeacherCourseOut(
                id=course.id,
                name=course.name,
                teacher_id=course.teacher_id,
                teacher_name=teacher_name,
                moodle_id=course.moodle_id,
                group_names=[group.name for group in groups],
                student_count=student_count,
                attendance_rate=attendance_rate,
            )
        )

    return results


@router.get("/courses/{course_id}/students", response_model=list[CourseStudentAttendanceOut])
def course_students(
    course_id: int,
    day: date | None = Query(default=None),
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return []
    if current_user.role == UserRole.teacher and course.teacher_id != current_user.id:
        return []

    groups = db.query(Group).filter(Group.course_id == course_id).all()
    group_map = {group.id: group.name for group in groups}
    group_ids = [group.id for group in groups]
    if not group_ids:
        return []

    students = (
        db.query(User)
        .filter(
            User.group_id.in_(group_ids),  # type: ignore[arg-type]
            User.role == UserRole.student,
        )
        .order_by(User.name.asc())
        .all()
    )

    attendance_map: dict[int, AttendanceStatus] = {}
    if day:
        rows = (
            db.query(Attendance)
            .filter(Attendance.course_id == course_id, Attendance.date == day)
            .all()
        )
        attendance_map = {row.student_id: row.status for row in rows}

    return [
        CourseStudentAttendanceOut(
            student_id=student.id,
            student_name=student.name,
            group_id=student.group_id,
            group_name=group_map.get(student.group_id),
            status=attendance_map.get(student.id),
        )
        for student in students
    ]


@router.post("/attendance/mark", response_model=list[AttendanceOut])
def mark_attendance(
    payload: list[MarkAttendanceItem],
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    return AttendanceService.mark_bulk(db, payload)


@router.get("/attendance", response_model=list[AttendanceOut])
def teacher_attendance(
    course_id: int | None = Query(default=None),
    day: date | None = Query(default=None),
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    q = db.query(Attendance).join(Course, Course.id == Attendance.course_id)
    if current_user.role == UserRole.teacher:
        q = q.filter(Course.teacher_id == current_user.id)
    if course_id:
        q = q.filter(Attendance.course_id == course_id)
    if day:
        q = q.filter(Attendance.date == day)
    return q.all()


@router.get("/homework", response_model=list[TeacherHomeworkOut])
def teacher_homework(
    course_id: int | None = Query(default=None),
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin, UserRole.student)),
    db: Session = Depends(get_db),
):
    q = _teacher_homework_query(db, current_user)
    if course_id:
        q = q.filter(Homework.course_id == course_id)

    rows = q.order_by(Homework.created_at.desc()).all()
    return [
        TeacherHomeworkOut(
            id=homework.id,
            course_id=homework.course_id,
            course_name=course_name,
            title=homework.title,
            description=homework.description,
            file_url=homework.file_url,
            created_at=homework.created_at,
        )
        for homework, course_name in rows
    ]


@router.post("/homework/create", response_model=HomeworkOut)
async def create_homework(
    course_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    if not _teacher_can_access_course(db, current_user, course_id):
        raise HTTPException(status_code=404, detail="Course not found or unavailable")
    hw = await HomeworkService.create(db, course_id, title, description, file)
    group_ids = [gid for (gid,) in db.query(Group.id).filter(Group.course_id == course_id).all()]
    if group_ids:
        students = (
            db.query(User)
            .filter(User.group_id.in_(group_ids), User.role == UserRole.student)  # type: ignore[arg-type]
            .all()
        )
        NotificationService.create_many(db, [s.id for s in students], f"New homework: {title}")
    return hw


@router.put("/homework/{homework_id}", response_model=HomeworkOut)
async def update_homework(
    homework_id: int,
    course_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile | None = File(default=None),
    remove_file: bool = Form(default=False),
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    if not _teacher_can_access_course(db, current_user, course_id):
        raise HTTPException(status_code=404, detail="Course not found or unavailable")

    homework = (
        db.query(Homework)
        .join(Course, Course.id == Homework.course_id)
        .filter(Homework.id == homework_id)
        .first()
    )
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    if current_user.role == UserRole.teacher:
        course = db.query(Course).filter(Course.id == homework.course_id).first()
        if not course or course.teacher_id != current_user.id:
            raise HTTPException(status_code=404, detail="Homework not found")

    return await HomeworkService.update(db, homework, course_id, title, description, file, remove_file)


@router.delete("/homework/{homework_id}")
def delete_homework(
    homework_id: int,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    homework = (
        db.query(Homework)
        .join(Course, Course.id == Homework.course_id)
        .filter(Homework.id == homework_id)
        .first()
    )
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    if current_user.role == UserRole.teacher:
        course = db.query(Course).filter(Course.id == homework.course_id).first()
        if not course or course.teacher_id != current_user.id:
            raise HTTPException(status_code=404, detail="Homework not found")

    HomeworkService.delete(db, homework)
    return {"status": "deleted"}


@router.get("/homework/{homework_id}/submissions", response_model=list[HomeworkSubmissionOut])
def homework_submissions(
    homework_id: int,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin, UserRole.student)),
    db: Session = Depends(get_db),
):
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework or not _teacher_can_access_course(db, current_user, homework.course_id):
        raise HTTPException(status_code=404, detail="Homework not found or unavailable")

    rows = (
        db.query(
            HomeworkSubmission,
            Homework.title,
            Course.id,
            Course.name,
            User.id,
            User.name,
            User.email,
            HomeworkReview.reviewer_id,
            HomeworkReview.grade,
            HomeworkReview.feedback,
            HomeworkReview.graded_at,
        )
        .join(Homework, Homework.id == HomeworkSubmission.homework_id)
        .join(Course, Course.id == Homework.course_id)
        .join(User, User.id == HomeworkSubmission.student_id)
        .outerjoin(HomeworkReview, HomeworkReview.submission_id == HomeworkSubmission.id)
        .filter(HomeworkSubmission.homework_id == homework_id)
        .order_by(HomeworkSubmission.submitted_at.desc())
        .all()
    )
    return [
        HomeworkSubmissionOut(
            submission_id=submission.id,
            homework_id=homework_id,
            homework_title=homework_title,
            course_id=course_id,
            course_name=course_name,
            student_id=student_id,
            student_name=student_name,
            file_url=submission.file_url,
            submitted_at=submission.submitted_at,
            reviewer_id=reviewer_id,
            grade=float(grade) if grade is not None else None,
            feedback=feedback,
            graded_at=graded_at,
        )
        for submission, homework_title, course_id, course_name, student_id, student_name, student_email, reviewer_id, grade, feedback, graded_at in rows
    ]


@router.put("/homework/submissions/{submission_id}/review", response_model=HomeworkSubmissionOut)
def review_submission(
    submission_id: int,
    payload: HomeworkSubmissionReviewRequest,
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin, UserRole.student)),
    db: Session = Depends(get_db),
):
    submission = db.query(HomeworkSubmission).filter(HomeworkSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    homework = db.query(Homework).filter(Homework.id == submission.homework_id).first()
    if not homework or not _teacher_can_access_course(db, current_user, homework.course_id):
        raise HTTPException(status_code=404, detail="Submission not found or unavailable")

    review = db.query(HomeworkReview).filter(HomeworkReview.submission_id == submission_id).first()
    if not review:
        review = HomeworkReview(
            submission_id=submission_id,
            reviewer_id=current_user.id,
            grade=payload.grade,
            feedback=payload.feedback,
        )
        db.add(review)
    else:
        review.reviewer_id = current_user.id
        review.grade = payload.grade
        review.feedback = payload.feedback
    db.commit()
    db.refresh(review)

    workspace = db.query(CourseWorkspace).filter(CourseWorkspace.course_id == homework.course_id).first()
    student = db.query(User).filter(User.id == submission.student_id).first()
    course = db.query(Course).filter(Course.id == homework.course_id).first()
    GoogleSheetsService.sync_grade(
        workspace.google_sheet_url if workspace else None,
        {
            "submission_id": submission.id,
            "course_name": course.name if course else "",
            "homework_title": homework.title,
            "student_name": student.name if student else "",
            "student_email": student.email if student else "",
            "grade": payload.grade,
            "feedback": payload.feedback or "",
            "graded_at": review.graded_at.isoformat() if review.graded_at else "",
        },
    )

    return HomeworkSubmissionOut(
        submission_id=submission.id,
        homework_id=homework.id,
        homework_title=homework.title,
        course_id=homework.course_id,
        course_name=course.name if course else "",
        student_id=student.id if student else 0,
        student_name=student.name if student else "",
        file_url=submission.file_url,
        submitted_at=submission.submitted_at,
        reviewer_id=review.reviewer_id,
        grade=float(review.grade) if review.grade is not None else None,
        feedback=review.feedback,
        graded_at=review.graded_at,
    )


@router.get("/statistics", response_model=list[CourseAttendanceStat])
def teacher_stats(
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.admin:
        teacher_ids = [teacher_id for (teacher_id,) in db.query(Course.teacher_id).distinct().all()]
        stats = []
        for teacher_id in teacher_ids:
            stats.extend(AttendanceService.course_stats(db, teacher_id))
        return stats
    return AttendanceService.course_stats(db, current_user.id)


@router.get("/reports/attendance.xlsx")
def export_attendance_report(
    current_user: User = Depends(require_role(UserRole.teacher, UserRole.admin)),
    db: Session = Depends(get_db),
):
    xlsx = ReportService.attendance_report_xlsx(db, current_user.id)
    return StreamingResponse(
        iter([xlsx]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_report.xlsx"},
    )
