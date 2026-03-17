from __future__ import annotations

import secrets

from sqlalchemy.orm import Session

from api.config import settings
from auth.security import hash_password
from models.enums import UserRole
from models.user import User


class AdminBootstrapService:
    @staticmethod
    def ensure_bootstrap_admin(db: Session) -> None:
        email = settings.bootstrap_admin_email.strip().lower()
        if not email:
            return

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                db.commit()
            return

        db.add(
            User(
                name=settings.bootstrap_admin_name.strip() or "Platform Admin",
                email=email,
                password_hash=hash_password(secrets.token_urlsafe(32)),
                role=UserRole.admin,
            )
        )
        db.commit()
