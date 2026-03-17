from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.sql import func

from database.session import Base


class HomeworkReview(Base):
    __tablename__ = "homework_reviews"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("homework_submissions.id"), nullable=False, unique=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    grade = Column(Numeric(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
