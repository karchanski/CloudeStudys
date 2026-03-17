from PySide6.QtWidgets import QFrame, QGridLayout, QHBoxLayout, QLabel, QListWidget, QVBoxLayout, QWidget


class DashboardScreen(QWidget):
    def __init__(self) -> None:
        super().__init__()
        root = QVBoxLayout(self)
        root.setSpacing(12)

        title = QLabel("Teacher Dashboard")
        title.setObjectName("PageTitle")
        subtitle = QLabel("Operational overview for attendance, homework, and class activity")
        subtitle.setObjectName("Muted")

        metrics = QGridLayout()
        cards = [
            ("Today Attendance", "91%", "#67e8f9"),
            ("Active Courses", "8", "#a78bfa"),
            ("Pending Homework", "14", "#f9a8d4"),
            ("Late Students", "6", "#fca5a5"),
        ]

        for i, (label, value, color) in enumerate(cards):
            card = QFrame()
            card.setObjectName("PanelSoft")
            lay = QVBoxLayout(card)
            lay.addWidget(QLabel(label))
            val = QLabel(value)
            val.setStyleSheet(f"font-size: 32px; color: {color}; font-weight: 700;")
            lay.addWidget(val)
            delta = QLabel("Updated just now")
            delta.setObjectName("Muted")
            lay.addWidget(delta)
            metrics.addWidget(card, i // 2, i % 2)

        lower = QHBoxLayout()

        today_panel = QFrame()
        today_panel.setObjectName("PanelSoft")
        today_lay = QVBoxLayout(today_panel)
        h = QLabel("Today's timeline")
        h.setStyleSheet("font-size: 15px; font-weight: 600;")
        today_lay.addWidget(h)

        classes = QListWidget()
        classes.addItems([
            "09:00 - Databases · Room A-210",
            "11:00 - Networks · Room B-108",
            "14:30 - Data Structures · Lab C-12",
            "16:10 - Student consultation",
        ])
        today_lay.addWidget(classes)

        hint_panel = QFrame()
        hint_panel.setObjectName("PanelSoft")
        hint_lay = QVBoxLayout(hint_panel)
        hint_title = QLabel("Quick actions")
        hint_title.setStyleSheet("font-size: 15px; font-weight: 600;")
        hint_lay.addWidget(hint_title)
        hint_lay.addWidget(QLabel("- Mark attendance before 12:00"))
        hint_lay.addWidget(QLabel("- Publish new homework for DB group"))
        hint_lay.addWidget(QLabel("- Export weekly attendance report"))
        info = QLabel("Tip: use Moodle import each morning")
        info.setObjectName("Muted")
        hint_lay.addWidget(info)

        lower.addWidget(today_panel, 2)
        lower.addWidget(hint_panel, 1)

        root.addWidget(title)
        root.addWidget(subtitle)
        root.addLayout(metrics)
        root.addLayout(lower)
