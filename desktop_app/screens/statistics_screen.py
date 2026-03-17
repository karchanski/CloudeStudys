from PySide6.QtCharts import QBarCategoryAxis, QBarSeries, QBarSet, QChart, QChartView, QPieSeries, QValueAxis
from PySide6.QtGui import QBrush, QColor, QPainter
from PySide6.QtWidgets import QFrame, QHBoxLayout, QLabel, QVBoxLayout, QWidget


class StatisticsScreen(QWidget):
    def __init__(self) -> None:
        super().__init__()
        root = QVBoxLayout(self)
        title = QLabel("Statistics")
        title.setObjectName("PageTitle")
        subtitle = QLabel("Animated attendance distribution and course comparison")
        subtitle.setObjectName("Muted")

        row = QHBoxLayout()

        card1 = QFrame()
        card1.setObjectName("PanelSoft")
        lay1 = QVBoxLayout(card1)
        lay1.addWidget(self._attendance_pie())

        card2 = QFrame()
        card2.setObjectName("PanelSoft")
        lay2 = QVBoxLayout(card2)
        lay2.addWidget(self._course_bar())

        row.addWidget(card1)
        row.addWidget(card2)

        root.addWidget(title)
        root.addWidget(subtitle)
        root.addLayout(row)

    def _attendance_pie(self) -> QChartView:
        series = QPieSeries()
        present = series.append("Present", 78)
        absent = series.append("Absent", 14)
        late = series.append("Late", 8)
        present.setBrush(QBrush(QColor("#67e8f9")))
        absent.setBrush(QBrush(QColor("#fca5a5")))
        late.setBrush(QBrush(QColor("#a78bfa")))

        chart = QChart()
        chart.addSeries(series)
        chart.setTitle("Attendance Percentage")
        chart.setAnimationOptions(QChart.SeriesAnimations)
        chart.setBackgroundVisible(False)
        chart.legend().setLabelColor("#e8ebff")
        chart.setTitleBrush(QBrush(QColor("#e8ebff")))

        view = QChartView(chart)
        view.setRenderHint(QPainter.Antialiasing)
        return view

    def _course_bar(self) -> QChartView:
        set0 = QBarSet("Attendance %")
        set0.append([89, 93, 84, 91])
        set0.setColor(QColor("#4f7cff"))

        series = QBarSeries()
        series.append(set0)

        chart = QChart()
        chart.addSeries(series)
        chart.setTitle("Course Comparison")
        chart.setAnimationOptions(QChart.SeriesAnimations)
        chart.setBackgroundVisible(False)
        chart.setTitleBrush(QBrush(QColor("#e8ebff")))

        axis_x = QBarCategoryAxis()
        axis_x.append(["Databases", "Networks", "DS", "AI"])
        axis_x.setLabelsColor(QColor("#c5d1ff"))

        axis_y = QValueAxis()
        axis_y.setRange(0, 100)
        axis_y.setLabelsColor(QColor("#c5d1ff"))

        chart.addAxis(axis_x, 1)
        chart.addAxis(axis_y, 2)
        series.attachAxis(axis_x)
        series.attachAxis(axis_y)

        chart.legend().setLabelColor("#e8ebff")
        view = QChartView(chart)
        view.setRenderHint(QPainter.Antialiasing)
        return view
