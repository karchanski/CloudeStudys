import 'package:flutter/material.dart';

import '../widgets/glass_card.dart';
import '../widgets/page_shell.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoading = false;
    final rows = [
      ('New homework in Databases', '2m ago'),
      ('Attendance updated for Networks', '18m ago'),
      ('Tomorrow class moved to room B-204', '1h ago'),
    ];

    return PageShell(
      title: 'Notifications',
      subtitle: 'Latest updates from teachers and system',
      child: isLoading
          ? const Center(child: CircularProgressIndicator())
          : rows.isEmpty
              ? const Center(
                  child: Text(
                    'No notifications yet',
                    style: TextStyle(color: Color(0xFFA8B5FF)),
                  ),
                )
              : ListView.separated(
        itemCount: rows.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => GlassCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 3),
                width: 10,
                height: 10,
                decoration: const BoxDecoration(color: Color(0xFF67E8F9), shape: BoxShape.circle),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(rows[i].$1),
                    const SizedBox(height: 4),
                    Text(rows[i].$2, style: const TextStyle(fontSize: 12, color: Color(0xFFA8B5FF))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
