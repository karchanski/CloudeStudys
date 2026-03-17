import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

ThemeData buildDarkNeonTheme() {
  const base = Color(0xFF070A12);
  const panel = Color(0xFF121A2E);
  const neonBlue = Color(0xFF4F7CFF);
  const neonCyan = Color(0xFF67E8F9);
  const neonPurple = Color(0xFFA855F7);

  final textTheme = GoogleFonts.spaceGroteskTextTheme(ThemeData.dark().textTheme);

  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: base,
    textTheme: textTheme,
    colorScheme: const ColorScheme.dark(
      primary: neonBlue,
      secondary: neonPurple,
      surface: panel,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: Colors.white),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0x66141B2D),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0x557892FF)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0x557892FF)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: neonCyan),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xCC121A2E),
      indicatorColor: const Color(0x334F7CFF),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: neonBlue,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
  );
}
