from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from api.config import settings
from auth.security import create_refresh_token
from models.refresh_session import RefreshSession
from schemas.auth import RefreshSessionOut


class RefreshSessionService:
    @staticmethod
    def create(db: Session, user_id: int, user_agent: str | None = None, ip_address: str | None = None) -> tuple[str, str]:
        now = datetime.now(timezone.utc)
        jti = secrets.token_hex(16)
        session = RefreshSession(
            user_id=user_id,
            jti=jti,
            expires_at=now + timedelta(days=settings.jwt_refresh_expire_days),
            last_seen_at=now,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(session)
        db.commit()
        return create_refresh_token(str(user_id), jti=jti), jti

    @staticmethod
    def rotate(db: Session, refresh_token: str, user_agent: str | None = None, ip_address: str | None = None) -> tuple[int, str]:
        user_id, jti = RefreshSessionService._decode(refresh_token)
        session = db.query(RefreshSession).filter(RefreshSession.jti == jti).first()
        if not session or session.revoked or session.user_id != user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        if session.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh token expired")

        new_token, new_jti = RefreshSessionService.create(
            db,
            user_id,
            user_agent=user_agent or session.user_agent,
            ip_address=ip_address or session.ip_address,
        )
        session.revoked = True
        session.replaced_by_jti = new_jti
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return user_id, new_token

    @staticmethod
    def revoke(db: Session, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        try:
            _, jti = RefreshSessionService._decode(refresh_token)
        except HTTPException:
            return
        session = db.query(RefreshSession).filter(RefreshSession.jti == jti).first()
        if not session or session.revoked:
            return
        session.revoked = True
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()

    @staticmethod
    def revoke_by_id(db: Session, user_id: int, session_id: int) -> None:
        session = db.query(RefreshSession).filter(RefreshSession.id == session_id, RefreshSession.user_id == user_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.revoked:
            return
        session.revoked = True
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()

    @staticmethod
    def revoke_all_for_user(db: Session, user_id: int) -> int:
        now = datetime.now(timezone.utc)
        sessions = db.query(RefreshSession).filter(RefreshSession.user_id == user_id, RefreshSession.revoked.is_(False)).all()
        for session in sessions:
            session.revoked = True
            session.revoked_at = now
        db.commit()
        return len(sessions)

    @staticmethod
    def list_for_user(db: Session, user_id: int, current_refresh_token: str | None) -> list[RefreshSessionOut]:
        current_jti: str | None = None
        if current_refresh_token:
            try:
                _, current_jti = RefreshSessionService._decode(current_refresh_token)
            except HTTPException:
                current_jti = None

        sessions = (
            db.query(RefreshSession)
            .filter(RefreshSession.user_id == user_id)
            .order_by(RefreshSession.created_at.desc())
            .all()
        )
        return [
            RefreshSessionOut(
                id=session.id,
                created_at=session.created_at.isoformat(),
                expires_at=session.expires_at.isoformat(),
                last_seen_at=session.last_seen_at.isoformat() if session.last_seen_at else None,
                user_agent=session.user_agent,
                ip_address=session.ip_address,
                revoked=session.revoked,
                is_current=session.jti == current_jti,
            )
            for session in sessions
        ]

    @staticmethod
    def _decode(refresh_token: str) -> tuple[int, str]:
        try:
            payload = jwt.decode(refresh_token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            user_id = payload.get("sub")
            token_type = payload.get("type")
            jti = payload.get("jti")
            if token_type != "refresh" or not user_id or not jti:
                raise HTTPException(status_code=401, detail="Invalid refresh token")
            return int(user_id), str(jti)
        except JWTError as exc:
            raise HTTPException(status_code=401, detail="Invalid refresh token") from exc
