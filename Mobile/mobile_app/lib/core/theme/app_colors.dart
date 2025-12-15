import 'package:flutter/material.dart';

class AppColors {
  static const MaterialColor primary = MaterialColor(0xFF6366F1, {
    50: Color(0xFFEEF2FF),
    100: Color(0xFFE0E7FF),
    200: Color(0xFFC7D2FE),
    300: Color(0xFFA5B4FC),
    400: Color(0xFF818CF8),
    500: Color(0xFF6366F1), // Primary
    600: Color(0xFF4F46E5),
    700: Color(0xFF4338CA),
    800: Color(0xFF3730A3),
    900: Color(0xFF312E81),
    950: Color(0xFF1E1B4B),
  });

  static const MaterialColor secondary = MaterialColor(0xFF64748B, {
    50: Color(0xFFF8FAFC),
    100: Color(0xFFF1F5F9),
    200: Color(0xFFE2E8F0),
    300: Color(0xFFCBD5E1),
    400: Color(0xFF94A3B8),
    500: Color(0xFF64748B), // Secondary
    600: Color(0xFF475569),
    700: Color(0xFF334155),
    800: Color(0xFF1E293B),
    900: Color(0xFF0F172A),
    950: Color(0xFF020617),
  });

  static const MaterialColor success = MaterialColor(0xFF22C55E, {
    50: Color(0xFFF0FDF4),
    500: Color(0xFF22C55E),
    700: Color(0xFF15803D),
  });

  static const MaterialColor warning = MaterialColor(0xFFEAB308, {
    50: Color(0xFFFEFCE8),
    500: Color(0xFFEAB308),
    700: Color(0xFFA16207),
  });

  static const MaterialColor danger = MaterialColor(0xFFEF4444, {
    50: Color(0xFFFEF2F2),
    500: Color(0xFFEF4444),
    700: Color(0xFFB91C1C),
  });
}
