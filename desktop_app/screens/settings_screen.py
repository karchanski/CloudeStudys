from PySide6.QtWidgets import QFormLayout, QFrame, QLineEdit, QPushButton, QVBoxLayout, QWidget


class SettingsScreen(QWidget):
    def __init__(self) -> None:
        super().__init__()
        root = QVBoxLayout(self)

        title_card = QFrame()
        title_card.setObjectName("PanelSoft")
        title_form = QFormLayout(title_card)
        title_form.addRow("API Base URL", QLineEdit("http://192.168.0.10:8000"))
        title_form.addRow("Teacher Token", QLineEdit())
        title_form.addRow("Moodle Base URL", QLineEdit("http://moodle.local"))
        title_form.addRow("", QPushButton("Save Settings"))

        root.addWidget(title_card)
        root.addStretch(1)
