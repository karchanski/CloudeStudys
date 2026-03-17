import 'package:flutter/material.dart';

import '../widgets/glass_card.dart';
import '../widgets/page_shell.dart';

class HomeworkScreen extends StatelessWidget {
  const HomeworkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoading = false;
    final hw = [
      ('ER-diagram project', 'Databases', 'Tomorrow'),
      ('Subnetting worksheet', 'Networks', '2 days'),
      ('Algorithm analysis report', 'Data Structures', '5 days'),
    ];
    return PageShell(
      title: 'Homework',
      subtitle: 'Downloads, deadlines and submission status',
      child: isLoading
          ? const Center(child: CircularProgressIndicator())
          : hw.isEmpty
              ? const Center(
                  child: Text(
                    'No homework assigned',
                    style: TextStyle(color: Color(0xFFA8B5FF)),
                  ),
                )
              : ListView.separated(
        itemCount: hw.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) => GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: Text(hw[i].$1, style: const TextStyle(fontWeight: FontWeight.w700))),
                  const Icon(Icons.download_outlined, color: Color(0xFF7DD3FC)),
                ],
              ),
              const SizedBox(height: 6),
              Text(hw[i].$2, style: const TextStyle(color: Color(0xFFA8B5FF))),
              const SizedBox(height: 8),
              Text('Due: ${hw[i].$3}', style: const TextStyle(color: Color(0xFFF9A8D4), fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}
