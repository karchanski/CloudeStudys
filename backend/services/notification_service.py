from sqlalchemy.orm import Session

from models.notification import Notification
from models.user import User
from services.telegram_service import TelegramService


class NotificationService:
    @staticmethod
    def create(db: Session, user_id: int, message: str) -> Notification:
        n = Notification(user_id=user_id, message=message)
        db.add(n)
        db.commit()
        db.refresh(n)
        return n

    @staticmethod
    def create_many(db: Session, user_ids: list[int], message: str) -> int:
        if not user_ids:
            return 0
        db.add_all([Notification(user_id=user_id, message=message) for user_id in user_ids])
        db.commit()
        telegram_ids = [
            telegram_id
            for (telegram_id,) in db.query(User.telegram_id).filter(User.id.in_(user_ids)).all()  # type: ignore[arg-type]
            if telegram_id
        ]
        for telegram_id in telegram_ids:
            TelegramService.send_message(telegram_id, message)
        return len(user_ids)
