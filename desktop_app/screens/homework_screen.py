from PySide6.QtWidgets import (
    QComboBox,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)


class HomeworkScreen(QWidget):
    def __init__(self) -> None:
        super().__init__()
        root = QVBoxLayout(self)
        root.setSpacing(12)

        title = QLabel("Homework Publisher")
        title.setObjectName("PageTitle")

        card = QFrame()
        card.setObjectName("PanelSoft")
        lay = QGridLayout(card)

        self.title_input = QLineEdit()
        self.title_input.setPlaceholderText("Homework title")

        self.description_input = QTextEdit()
        self.description_input.setPlaceholderText("Detailed task description")

        self.course_select = QComboBox()
        self.course_select.addItems(["Databases", "Computer Networks", "Data Structures"])

        file_row = QHBoxLayout()
        upload_btn = QPushButton("Attach File")
        upload_btn.setObjectName("Ghost")
        self.file_label = QLabel("No file selected")
        self.file_label.setObjectName("Muted")
        file_row.addWidget(upload_btn)
        file_row.addWidget(self.file_label)

        action_row = QHBoxLayout()
        draft_btn = QPushButton("Save Draft")
        draft_btn.setObjectName("Ghost")
        send_btn = QPushButton("Publish Homework")
        action_row.addWidget(draft_btn)
        action_row.addWidget(send_btn)
        action_row.addStretch(1)

        lay.addWidget(QLabel("Title"), 0, 0)
        lay.addWidget(self.title_input, 1, 0)
        lay.addWidget(QLabel("Course"), 0, 1)
        lay.addWidget(self.course_select, 1, 1)
        lay.addWidget(QLabel("Description"), 2, 0, 1, 2)
        lay.addWidget(self.description_input, 3, 0, 1, 2)

        bottom = QVBoxLayout()
        bottom.addLayout(file_row)
        bottom.addLayout(action_row)
        lay.addLayout(bottom, 4, 0, 1, 2)

        root.addWidget(title)
        root.addWidget(card)
