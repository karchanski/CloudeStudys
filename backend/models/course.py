from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database.session import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    moodle_id = Column(String(128), nullable=True, index=True)

    teacher = relationship("User", back_populates="taught_courses")
