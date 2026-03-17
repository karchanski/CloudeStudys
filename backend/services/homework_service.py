from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from api.config import settings
from models.homework import Homework


class HomeworkService:
    @staticmethod
    def _delete_file(file_url: str | None) -> None:
        if not file_url:
            return
        path = Path(file_url)
        if path.exists() and path.is_file():
            path.unlink()

    @staticmethod
    async def _store_file(file: UploadFile | None) -> str | None:
        if not file:
            return None

        folder = Path(settings.storage_root) / "homework"
        folder.mkdir(parents=True, exist_ok=True)
        ext = os.path.splitext(file.filename or "")[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        path = folder / filename
        content = await file.read()
        path.write_bytes(content)
        return str(path)

    @staticmethod
    async def create(
        db: Session,
        course_id: int,
        title: str,
        description: str,
        file: UploadFile | None,
    ) -> Homework:
        file_url = await HomeworkService._store_file(file)
        hw = Homework(course_id=course_id, title=title, description=description, file_url=file_url)
        db.add(hw)
        db.commit()
        db.refresh(hw)
        return hw

    @staticmethod
    async def update(
        db: Session,
        hw: Homework,
        course_id: int,
        title: str,
        description: str,
        file: UploadFile | None,
        remove_file: bool = False,
    ) -> Homework:
        hw.course_id = course_id
        hw.title = title
        hw.description = description

        if remove_file:
            HomeworkService._delete_file(hw.file_url)
            hw.file_url = None

        if file:
            HomeworkService._delete_file(hw.file_url)
            hw.file_url = await HomeworkService._store_file(file)

        db.commit()
        db.refresh(hw)
        return hw

    @staticmethod
    def delete(db: Session, hw: Homework) -> None:
        HomeworkService._delete_file(hw.file_url)
        db.delete(hw)
        db.commit()
