from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from api.config import settings
from controllers.admin_controller import router as admin_router
from controllers.auth_controller import router as auth_router
from controllers.bot_controller import router as bot_router
from controllers.moodle_controller import router as moodle_router
from controllers.student_controller import router as student_router
from controllers.teacher_controller import router as teacher_router
from database.session import Base, SessionLocal, engine
from models import *  # noqa: F401,F403
from moodle.sync_job import sync_moodle_courses
from services.admin_bootstrap_service import AdminBootstrapService

app = FastAPI(title="SMART EDU JOURNAL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(student_router)
app.include_router(teacher_router)
app.include_router(admin_router)
app.include_router(moodle_router)
app.include_router(bot_router)

scheduler = BackgroundScheduler(timezone="UTC")


def ensure_refresh_session_columns() -> None:
    inspector = inspect(engine)
    if "refresh_sessions" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("refresh_sessions")}
    statements: list[str] = []
    if "last_seen_at" not in existing_columns:
        statements.append("ALTER TABLE refresh_sessions ADD COLUMN last_seen_at TIMESTAMP")
    if "user_agent" not in existing_columns:
        statements.append("ALTER TABLE refresh_sessions ADD COLUMN user_agent VARCHAR(255)")
    if "ip_address" not in existing_columns:
        statements.append("ALTER TABLE refresh_sessions ADD COLUMN ip_address VARCHAR(64)")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_refresh_session_columns()
    db = SessionLocal()
    try:
        AdminBootstrapService.ensure_bootstrap_admin(db)
    finally:
        db.close()
    scheduler.add_job(sync_moodle_courses, "interval", minutes=30, id="moodle-sync", replace_existing=True)
    scheduler.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    scheduler.shutdown(wait=False)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
