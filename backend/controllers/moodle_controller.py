from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.deps import require_role
from api.config import settings
from database.session import get_db
from models.enums import UserRole
from models.user import User
from schemas.moodle import MoodleConnectionOut, MoodleStatusOut, MoodleSyncLogOut
from services.moodle_service import MoodleService
from services.moodle_sync_service import state

router = APIRouter(prefix="/moodle", tags=["Moodle"])


@router.post("/sync")
async def sync_moodle(
    current_user: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    entry = state.start()
    try:
        synced = await MoodleService.sync_courses(db, default_teacher_id=current_user.id)
        state.finish(entry, status="success", synced=synced, message=f"Synchronized {synced} courses")
    except Exception as exc:
        state.finish(entry, status="error", synced=0, message=str(exc))
        raise
    return {"synced": synced}


@router.get("/status", response_model=MoodleStatusOut)
async def moodle_status(
    _: User = Depends(require_role(UserRole.admin)),
):
    recent_logs = [
        MoodleSyncLogOut(
            started_at=item.started_at,
            finished_at=item.finished_at,
            status=item.status,
            synced=item.synced,
            message=item.message,
        )
        for item in state.logs
    ]
    return MoodleStatusOut(
        base_url=settings.moodle_base_url,
        auth_mode=MoodleService.auth_mode(),
        has_token=bool(settings.moodle_token and settings.moodle_token != "CHANGE_ME"),
        has_credentials=bool(settings.moodle_username and settings.moodle_password),
        last_sync=recent_logs[0] if recent_logs else None,
        recent_logs=recent_logs,
    )


@router.post("/test-connection", response_model=MoodleConnectionOut)
async def moodle_test_connection(
    _: User = Depends(require_role(UserRole.admin)),
):
    ok, message = await MoodleService.test_connection()
    return MoodleConnectionOut(ok=ok, message=message)


@router.get("/enrollments/{moodle_course_id}")
async def get_enrollments(
    moodle_course_id: str,
    _: User = Depends(require_role(UserRole.admin, UserRole.teacher)),
):
    rows = await MoodleService.fetch_enrollments(moodle_course_id)
    return {"count": len(rows), "items": rows}
