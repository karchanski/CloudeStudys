from PySide6.QtCore import QDate, Qt
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QDateEdit,
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)


class AttendanceScreen(QWidget):
    def __init__(self) -> None:
        super().__init__()
        root = QVBoxLayout(self)
        root.setSpacing(12)

        title = QLabel("Attendance")
        title.setObjectName("PageTitle")

        toolbar = QFrame()
        toolbar.setObjectName("PanelSoft")
        tool_lay = QHBoxLayout(toolbar)
        self.course_select = QComboBox()
        self.course_select.addItems(["Databases", "Networks", "Data Structures"])
        self.date = QDateEdit(QDate.currentDate())
        self.date.setCalendarPopup(True)
        save_btn = QPushButton("Save Marks")
        save_btn.setObjectName("Ghost")

        tool_lay.addWidget(QLabel("Course"))
        tool_lay.addWidget(self.course_select)
        tool_lay.addWidget(QLabel("Date"))
        tool_lay.addWidget(self.date)
        tool_lay.addStretch(1)
        tool_lay.addWidget(save_btn)

        card = QFrame()
        card.setObjectName("PanelSoft")
        lay = QVBoxLayout(card)

        table = QTableWidget(6, 4)
        table.setHorizontalHeaderLabels(["Student", "Present", "Absent", "Late"])
        students = ["Alex Carter", "Mia Walker", "Noah Reed", "Emma Hall", "Liam Scott", "Sophia Young"]

        for row, student in enumerate(students):
            table.setItem(row, 0, QTableWidgetItem(student))
            for col in range(1, 4):
                cb = QCheckBox()
                cb.setStyleSheet("margin-left:18px")
                if col == 1:
                    cb.setChecked(True)
                table.setCellWidget(row, col, cb)

        table.horizontalHeader().setStretchLastSection(True)
        table.horizontalHeader().setDefaultAlignment(Qt.AlignmentFlag.AlignLeft)

        legend = QLabel("Legend: Present · Absent · Late")
        legend.setObjectName("Muted")
        save_hint = QLabel("Unsaved changes are highlighted until you click Save Marks.")
        save_hint.setObjectName("Muted")

        lay.addWidget(table)
        lay.addWidget(legend)
        lay.addWidget(save_hint)

        root.addWidget(title)
        root.addWidget(toolbar)
        root.addWidget(card)
