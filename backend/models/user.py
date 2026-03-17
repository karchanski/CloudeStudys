from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship

from database.session import Base
from models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    telegram_id = Column(String(64), nullable=True, unique=True)

    group = relationship("Group", back_populates="students")
    taught_courses = relationship("Course", back_populates="teacher")
