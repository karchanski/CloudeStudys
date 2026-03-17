import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from api.config import settings
from auth.security import create_access_token, hash_password, verify_password
from models.enums import UserRole
from models.user import User
from schemas.auth import LoginRequest, MoodleLoginRequest, RegisterRequest, TelegramLinkRequest, TokenPair
from services.moodle_service import MoodleService
from services.refresh_session_service import RefreshSessionService
from services.telegram_link_service import TelegramLinkService


class AuthService:
    @staticmethod
    def _parse_csv(value: str) -> set[str]:
        return {item.strip().lower() for item in value.split(",") if item.strip()}

    @staticmethod
    def _is_admin_identity(email: str, username: str) -> bool:
        admin_emails = AuthService._parse_csv(settings.admin_emails)
        admin_usernames = AuthService._parse_csv(settings.admin_usernames)
        return email.lower() in admin_emails or username.lower() in admin_usernames

    @staticmethod
    def register(db: Session, payload: RegisterRequest) -> User:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already exists")

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

    @staticmethod
    def login(db: Session, payload: LoginRequest, user_agent: str | None = None, ip_address: str | None = None) -> TokenPair:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        refresh_token, _ = RefreshSessionService.create(db, user.id, user_agent=user_agent, ip_address=ip_address)
        return TokenPair(
            access_token=create_access_token(str(user.id)),
            refresh_token=refresh_token,
        )

    @staticmethod
    async def moodle_login(
        db: Session,
        payload: MoodleLoginRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenPair:
        try:
            moodle_user = await MoodleService.authenticate_user(payload.username, payload.password)
        except Exception as exc:
            raise HTTPException(status_code=401, detail="Invalid Moodle credentials") from exc

        email = moodle_user["email"]
        name = moodle_user["name"]
        requested_role = payload.role if payload.role in (UserRole.teacher, UserRole.student) else UserRole.teacher
        is_admin = AuthService._is_admin_identity(email, payload.username)

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=hash_password(secrets.token_urlsafe(32)),
                role=UserRole.admin if is_admin else requested_role,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.name = name
            if is_admin or user.role == UserRole.admin:
                user.role = UserRole.admin
            elif user.role == UserRole.student and requested_role == UserRole.teacher:
                user.role = UserRole.teacher
            elif user.role not in (UserRole.teacher, UserRole.admin):
                user.role = requested_role
            db.commit()
            db.refresh(user)

        refresh_token, _ = RefreshSessionService.create(db, user.id, user_agent=user_agent, ip_address=ip_address)
        return TokenPair(access_token=create_access_token(str(user.id)), refresh_token=refresh_token)

    @staticmethod
    def refresh(db: Session, refresh_token: str, user_agent: str | None = None, ip_address: str | None = None) -> TokenPair:
        user_id, next_refresh_token = RefreshSessionService.rotate(
            db,
            refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        return TokenPair(
            access_token=create_access_token(str(user_id)),
            refresh_token=next_refresh_token,
        )

    @staticmethod
    def logout(db: Session, refresh_token: str | None) -> dict:
        RefreshSessionService.revoke(db, refresh_token)
        return {"status": "logged_out"}

    @staticmethod
    def logout_all(db: Session, user_id: int) -> dict:
        revoked_sessions = RefreshSessionService.revoke_all_for_user(db, user_id)
        return {"status": "logged_out_all", "revoked_sessions": revoked_sessions}

    @staticmethod
    def link_telegram(db: Session, payload: TelegramLinkRequest) -> dict:
        user_id = TelegramLinkService.consume_code(payload.code)
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid or expired Telegram link code")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != UserRole.student:
            raise HTTPException(status_code=404, detail="Student not found")
        user.telegram_id = payload.telegram_id
        db.commit()
        return {"status": "linked"}
