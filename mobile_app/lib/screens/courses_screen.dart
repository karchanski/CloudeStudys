import 'package:flutter/material.dart';

import '../widgets/glass_card.dart';
import '../widgets/page_shell.dart';

class CoursesScreen extends StatelessWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoading = false;
    final courses = [
      ('Databases', 'Dr. Miller', '89%'),
      ('Computer Networks', 'Dr. Kim', '94%'),
      ('Data Structures', 'Dr. Novak', '84%'),
      ('Machine Learning', 'Dr. Silva', '91%'),
    ];
    return PageShell(
      title: 'Courses',
      subtitle: 'All active subjects this semester',
      child: isLoading
          ? const Center(child: CircularProgressIndicator())
          : courses.isEmpty
              ? const Center(
                  child: Text(
                    'No courses available yet',
                    style: TextStyle(color: Color(0xFFA8B5FF)),
                  ),
                )
              : ListView.separated(
        itemCount: courses.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => GlassCard(
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0x334F7CFF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu_book, color: Color(0xFF7DD3FC)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(courses[i].$1, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(courses[i].$2, style: const TextStyle(color: Color(0xFFA8B5FF), fontSize: 12)),
                  ],
                ),
              ),
              Text(courses[i].$3, style: const TextStyle(color: Color(0xFF67E8F9), fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
