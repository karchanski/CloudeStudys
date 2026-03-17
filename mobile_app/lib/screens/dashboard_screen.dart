import 'package:flutter/material.dart';

import '../widgets/glass_card.dart';
import '../widgets/page_shell.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return PageShell(
      title: 'Dashboard',
      subtitle: 'Overview of attendance, courses and deadlines',
      child: ListView(
        children: [
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: const [
              GlassCard(child: _Metric(title: 'Attendance', value: '92%', tone: Color(0xFF67E8F9))),
              GlassCard(child: _Metric(title: 'Homework Due', value: '4', tone: Color(0xFFA78BFA))),
              GlassCard(child: _Metric(title: 'Courses', value: '6', tone: Color(0xFF93C5FD))),
              GlassCard(child: _Metric(title: 'Notifications', value: '3', tone: Color(0xFFF9A8D4))),
            ],
          ),
          const SizedBox(height: 12),
          const GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Today', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
                SizedBox(height: 8),
                Text('10:00  Databases lecture · A-210'),
                SizedBox(height: 4),
                Text('13:00  Networks lab · C-104'),
                SizedBox(height: 4),
                Text('17:00  Homework deadline · Data Structures', style: TextStyle(color: Color(0xFFA8B5FF))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String title;
  final String value;
  final Color tone;

  const _Metric({required this.title, required this.value, required this.tone});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(color: Color(0xFFA8B5FF))),
        Text(value, style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: tone)),
      ],
    );
  }
}
