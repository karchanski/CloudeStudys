from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.attendance import Attendance
from models.course import Course
from models.enums import AttendanceStatus
from schemas.attendance import MarkAttendanceItem
from schemas.statistics import CourseAttendanceStat


class AttendanceService:
    @staticmethod
    def mark_bulk(db: Session, items: list[MarkAttendanceItem]) -> list[Attendance]:
        records: list[Attendance] = []
        for item in items:
            record = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id == item.student_id,
                    Attendance.course_id == item.course_id,
                    Attendance.date == item.date,
                )
                .first()
            )
            if record:
                record.status = item.status
            else:
                record = Attendance(
                    student_id=item.student_id,
                    course_id=item.course_id,
                    date=item.date,
                    status=item.status,
                )
                db.add(record)
            records.append(record)

        db.commit()
        for rec in records:
            db.refresh(rec)
        return records

    @staticmethod
    def course_stats(db: Session, teacher_id: int) -> list[CourseAttendanceStat]:
        rows = (
            db.query(Course.id, Course.name, Attendance.status, func.count(Attendance.id))
            .join(Attendance, Attendance.course_id == Course.id, isouter=True)
            .filter(Course.teacher_id == teacher_id)
            .group_by(Course.id, Course.name, Attendance.status)
            .all()
        )

        counter: dict[int, dict[str, float | str]] = defaultdict(
            lambda: {"course_name": "", "present": 0, "absent": 0, "late": 0, "total": 0}
        )

        for course_id, course_name, status, count in rows:
            counter[course_id]["course_name"] = course_name
            if status:
                counter[course_id][status.value] += count
                counter[course_id]["total"] += count

        stats: list[CourseAttendanceStat] = []
        for course_id, data in counter.items():
            total = float(data["total"]) or 1.0
            stats.append(
                CourseAttendanceStat(
                    course_id=course_id,
                    course_name=str(data["course_name"]),
                    present_percent=round((float(data[AttendanceStatus.present.value]) / total) * 100, 2),
                    absent_percent=round((float(data[AttendanceStatus.absent.value]) / total) * 100, 2),
                    late_percent=round((float(data[AttendanceStatus.late.value]) / total) * 100, 2),
                )
            )
        return stats
