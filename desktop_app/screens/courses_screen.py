from PySide6.QtWidgets import QFrame, QGridLayout, QLabel, QProgressBar, QVBoxLayout, QWidget


class CoursesScreen(QWidget):
    def __init__(self) -> None:
        super().__init__()
        root = QVBoxLayout(self)
        root.setSpacing(12)

        title = QLabel("Courses")
        title.setObjectName("PageTitle")
        subtitle = QLabel("Manage active classes and monitor attendance trend")
        subtitle.setObjectName("Muted")

        grid = QGridLayout()
        courses = [
            ("Computer Networks", "SE-21", 94),
            ("Databases", "SE-22", 89),
            ("Data Structures", "SE-23", 84),
            ("AI Fundamentals", "SE-24", 91),
        ]

        if not courses:
            empty = QFrame()
            empty.setObjectName("PanelSoft")
            el = QVBoxLayout(empty)
            msg = QLabel("No courses found")
            msg.setStyleSheet("font-size: 18px; font-weight: 700;")
            el.addWidget(msg)
            sub = QLabel("Import from Moodle or create courses from admin panel.")
            sub.setObjectName("Muted")
            el.addWidget(sub)
            root.addWidget(title)
            root.addWidget(subtitle)
            root.addWidget(empty)
            return

        for i, (name, group, rate) in enumerate(courses):
            card = QFrame()
            card.setObjectName("PanelSoft")
            lay = QVBoxLayout(card)
            course_name = QLabel(name)
            course_name.setStyleSheet("font-size: 16px; font-weight: 600; color: #7dd3fc;")
            lay.addWidget(course_name)
            lay.addWidget(QLabel(f"Group: {group}"))
            lay.addWidget(QLabel("Attendance rate"))
            progress = QProgressBar()
            progress.setValue(rate)
            progress.setFormat(f"{rate}%")
            lay.addWidget(progress)
            grid.addWidget(card, i // 2, i % 2)

        root.addWidget(title)
        root.addWidget(subtitle)
        root.addLayout(grid)
