from enum import Enum


class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"
