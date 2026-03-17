import asyncio

from database.session import SessionLocal
from services.moodle_service import MoodleService


def sync_moodle_courses() -> int:
    db = SessionLocal()
    try:
        # Fallback default teacher id can be set from admin seeding. Here 1 for bootstrap.
        return asyncio.run(MoodleService.sync_courses(db, default_teacher_id=1))
    finally:
        db.close()
