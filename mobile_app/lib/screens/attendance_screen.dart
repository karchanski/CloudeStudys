import 'package:flutter/material.dart';

import '../widgets/glass_card.dart';
import '../widgets/page_shell.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final rows = [
      ('Databases', 'Present', Color(0xFF67E8F9)),
      ('Networks', 'Late', Color(0xFFF9A8D4)),
      ('Data Structures', 'Present', Color(0xFF67E8F9)),
      ('Machine Learning', 'Absent', Color(0xFFFCA5A5)),
    ];

    return PageShell(
      title: 'Attendance',
      subtitle: 'Daily marks across your courses',
      child: ListView.separated(
        itemCount: rows.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => GlassCard(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(rows[i].$1),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: rows[i].$3.withOpacity(0.17),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: rows[i].$3.withOpacity(0.55)),
                ),
                child: Text(rows[i].$2, style: TextStyle(color: rows[i].$3, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
