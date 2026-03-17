import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../widgets/glass_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF070A12), Color(0xFF0E1630), Color(0xFF1A0F2A)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -80,
              left: -40,
              child: Container(
                width: 220,
                height: 220,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x334F7CFF),
                ),
              ),
            ),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 380),
                child: GlassCard(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('SMART EDU JOURNAL', style: TextStyle(color: Color(0xFF8EDFFF), fontSize: 14, letterSpacing: 1.1)),
                      const SizedBox(height: 6),
                      const Text('Student Sign In', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 16),
                      TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
                      const SizedBox(height: 12),
                      TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => context.read<AuthProvider>().login(email.text, password.text),
                          child: const Text('Continue'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text('Connected to campus network', style: TextStyle(color: Color(0xFF9AA9F8), fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
