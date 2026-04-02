import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_screen.dart';
import 'features/main/main_screen.dart';
import 'state/app_controller.dart';

class DamasticApp extends StatefulWidget {
  const DamasticApp({super.key});

  @override
  State<DamasticApp> createState() => _DamasticAppState();
}

class _DamasticAppState extends State<DamasticApp> {
  late final AppController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AppController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Damastic Mobile',
          theme: AppTheme.theme,
          home: _controller.isAuthenticated
              ? MainScreen(controller: _controller)
              : LoginScreen(controller: _controller),
        );
      },
    );
  }
}
