import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/app_shell.dart';
import 'screens/login_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const SmartEduApp());
}

class SmartEduApp extends StatelessWidget {
  const SmartEduApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: MaterialApp(
        title: 'SMART EDU JOURNAL',
        debugShowCheckedModeBanner: false,
        theme: buildDarkNeonTheme(),
        home: Consumer<AuthProvider>(
          builder: (_, auth, __) => AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: auth.isLoggedIn ? const AppShell() : const LoginScreen(),
          ),
        ),
      ),
    );
  }
}
