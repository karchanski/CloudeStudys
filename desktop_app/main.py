import sys

from PySide6.QtCore import QEasingCurve, Property, QPropertyAnimation
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QApplication,
    QFrame,
    QHBoxLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from screens.attendance_screen import AttendanceScreen
from screens.courses_screen import CoursesScreen
from screens.dashboard_screen import DashboardScreen
from screens.homework_screen import HomeworkScreen
from screens.login_screen import LoginScreen
from screens.settings_screen import SettingsScreen
from screens.statistics_screen import StatisticsScreen

STYLE = """
QWidget {
  background: #090b12;
  color: #ecf0ff;
  font-family: Inter;
}
QFrame#GlassPanel {
  background: rgba(15, 22, 38, 205);
  border: 1px solid rgba(122, 150, 255, 80);
  border-radius: 18px;
}
QFrame#PanelSoft {
  background: rgba(17, 25, 42, 170);
  border: 1px solid rgba(118, 144, 255, 70);
  border-radius: 14px;
}
QLabel#Title {
  font-size: 18px;
  font-weight: 700;
  color: #7fd9ff;
}
QLabel#PageTitle {
  font-size: 24px;
  font-weight: 700;
  color: #ebf0ff;
}
QLabel#Muted {
  color: #9fb2ff;
}
QListWidget {
  background: transparent;
  border: none;
  padding: 8px;
}
QListWidget::item {
  padding: 11px 12px;
  margin: 3px 0;
  border-radius: 11px;
  color: #b7c2ff;
}
QListWidget::item:selected {
  background: rgba(76, 112, 255, 0.34);
  color: white;
  border: 1px solid rgba(141, 214, 255, 0.45);
}
QPushButton {
  background: qlineargradient(x1:0,y1:0,x2:1,y2:1, stop:0 #2a63f6, stop:1 #7a3df2);
  border: 1px solid #84d8ff;
  border-radius: 11px;
  padding: 9px 14px;
  color: #ffffff;
  font-weight: 600;
}
QPushButton:hover {
  border: 1px solid #67e8f9;
}
QPushButton#Ghost {
  background: rgba(45, 68, 130, 0.35);
  border: 1px solid rgba(120, 146, 255, 100);
}
QLineEdit, QTextEdit, QComboBox, QTableWidget, QDateEdit {
  background: rgba(13, 19, 33, 225);
  border: 1px solid rgba(110, 138, 255, 105);
  border-radius: 10px;
  padding: 8px;
}
QHeaderView::section {
  background: rgba(60, 89, 170, 0.25);
  color: #d9e3ff;
  border: 0;
  padding: 8px;
}
QTableWidget {
  gridline-color: rgba(121, 143, 225, 0.25);
}
QProgressBar {
  border: 1px solid rgba(115, 141, 240, 0.5);
  border-radius: 8px;
  background: rgba(11, 16, 28, 0.9);
  text-align: center;
  color: #d9e5ff;
}
QProgressBar::chunk {
  background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #67e8f9, stop:1 #4f7cff);
  border-radius: 7px;
}
"""


class FadeStackedWidget(QStackedWidget):
    def __init__(self) -> None:
        super().__init__()
        self._opacity = 1.0

    def get_opacity(self):
        return self._opacity

    def set_opacity(self, value):
        self._opacity = value
        self.setWindowOpacity(value)

    opacity = Property(float, get_opacity, set_opacity)

    def animate_switch(self, index: int) -> None:
        self.setCurrentIndex(index)
        anim = QPropertyAnimation(self, b"opacity")
        anim.setDuration(260)
        anim.setStartValue(0.74)
        anim.setEndValue(1.0)
        anim.setEasingCurve(QEasingCurve.OutCubic)
        anim.start()
        self._anim = anim


class TeacherWorkspace(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.access_token = ""

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        sidebar = QFrame()
        sidebar.setObjectName("GlassPanel")
        side_layout = QVBoxLayout(sidebar)
        side_layout.setContentsMargins(14, 14, 14, 14)

        eyebrow = QLabel("Academic OS")
        eyebrow.setObjectName("Muted")
        title = QLabel("SMART EDU JOURNAL")
        title.setObjectName("Title")

        self.nav = QListWidget()
        for item in ["Dashboard", "Courses", "Attendance", "Homework", "Statistics", "Settings"]:
            QListWidgetItem(item, self.nav)
        self.nav.setCurrentRow(0)

        badge = QFrame()
        badge.setObjectName("PanelSoft")
        badge_lay = QVBoxLayout(badge)
        badge_lay.setContentsMargins(10, 10, 10, 10)
        badge_lay.addWidget(QLabel("Sync status"))
        ok = QLabel("Moodle connected")
        ok.setStyleSheet("color: #6ee7b7; font-weight: 600;")
        badge_lay.addWidget(ok)

        side_layout.addWidget(eyebrow)
        side_layout.addWidget(title)
        side_layout.addSpacing(8)
        side_layout.addWidget(self.nav)
        side_layout.addWidget(badge)
        sidebar.setMaximumWidth(280)

        self.stack = FadeStackedWidget()
        self.stack.addWidget(DashboardScreen())
        self.stack.addWidget(CoursesScreen())
        self.stack.addWidget(AttendanceScreen())
        self.stack.addWidget(HomeworkScreen())
        self.stack.addWidget(StatisticsScreen())
        self.stack.addWidget(SettingsScreen())

        layout.addWidget(sidebar)
        layout.addWidget(self.stack, 1)

        self.nav.currentRowChanged.connect(self.stack.animate_switch)


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("SMART EDU JOURNAL - Teacher Desktop")
        self.resize(1360, 840)

        self.root_stack = FadeStackedWidget()
        self.login_screen = LoginScreen()
        self.workspace = TeacherWorkspace()

        self.root_stack.addWidget(self.login_screen)
        self.root_stack.addWidget(self.workspace)
        self.root_stack.setCurrentIndex(0)

        self.login_screen.login_success.connect(self.on_login_success)

        self.setCentralWidget(self.root_stack)

    def on_login_success(self, access_token: str) -> None:
        self.workspace.access_token = access_token
        self.root_stack.animate_switch(1)


def main() -> None:
    app = QApplication(sys.argv)
    app.setStyleSheet(STYLE)
    app.setFont(QFont("Inter", 10))
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
