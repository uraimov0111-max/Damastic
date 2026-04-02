import 'package:flutter/material.dart';
import 'features/auth/login_screen.dart';

class DamasticApp extends StatelessWidget {
  const DamasticApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Damastic',
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: const Color(0xFF08111E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF12D18E),
          secondary: Color(0xFF4F8FFF),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
