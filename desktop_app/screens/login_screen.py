from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QComboBox,
    QFormLayout,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from services.auth_client import AuthClient


class LoginScreen(QWidget):
    login_success = Signal(str)

    def __init__(self) -> None:
        super().__init__()
        self.client = AuthClient()

        root = QVBoxLayout(self)
        root.setContentsMargins(30, 30, 30, 30)

        content = QHBoxLayout()

        left = QFrame()
        left.setObjectName("PanelSoft")
        left_lay = QVBoxLayout(left)
        left_lay.addWidget(QLabel("SMART EDU JOURNAL"))
        h = QLabel("Teacher Workspace")
        h.setStyleSheet("font-size: 30px; font-weight: 700; color: #ecf2ff;")
        left_lay.addWidget(h)
        left_lay.addWidget(QLabel("Modern attendance and homework control panel with Moodle integration."))
        left_lay.addStretch(1)
        left_lay.addWidget(QLabel("Dark UI · Neon accents · Glassmorphism"))

        container = QFrame()
        container.setObjectName("GlassPanel")
        container.setMaximumWidth(520)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(22, 22, 22, 22)
        layout.setSpacing(12)

        title = QLabel("Sign In")
        title.setObjectName("PageTitle")
        subtitle = QLabel("Use local account or Moodle credentials")
        subtitle.setObjectName("Muted")

        form = QFormLayout()
        form.setSpacing(10)

        self.mode = QComboBox()
        self.mode.addItems(["Local account", "Moodle"])

        self.login_field = QLineEdit()
        self.login_field.setPlaceholderText("teacher@college.edu or moodle_username")

        self.password_field = QLineEdit()
        self.password_field.setPlaceholderText("Password")
        self.password_field.setEchoMode(QLineEdit.Password)

        form.addRow("Login mode", self.mode)
        form.addRow("Email / Username", self.login_field)
        form.addRow("Password", self.password_field)

        button_row = QHBoxLayout()
        self.submit_btn = QPushButton("Sign In")
        self.submit_btn.clicked.connect(self.submit)
        button_row.addWidget(self.submit_btn)

        self.status = QLabel("")
        self.status.setStyleSheet("color: #fda4af;")

        layout.addWidget(title)
        layout.addWidget(subtitle)
        layout.addLayout(form)
        layout.addLayout(button_row)
        layout.addWidget(self.status)

        content.addWidget(left, 1)
        content.addWidget(container, 1)

        root.addLayout(content)

    def submit(self) -> None:
        login_text = self.login_field.text().strip()
        password = self.password_field.text().strip()

        if not login_text or not password:
            self.status.setText("Enter login and password")
            return

        try:
            if self.mode.currentText() == "Moodle":
                data = self.client.moodle_login(username=login_text, password=password, role="teacher")
            else:
                data = self.client.login(email=login_text, password=password)
        except Exception as exc:
            self.status.setText(f"Login failed: {exc}")
            return

        token = data.get("access_token", "")
        if not token:
            self.status.setText("Login failed: no access token")
            return

        self.status.setStyleSheet("color: #67e8f9;")
        self.status.setText("Authorized")
        self.login_success.emit(token)
