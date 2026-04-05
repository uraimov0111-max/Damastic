import 'package:flutter/material.dart';
import 'core/config/app_config.dart';
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
        final configError = AppConfig.validationError;

        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Damastic Mobile',
          theme: AppTheme.theme,
          home: configError != null
              ? _StatusScreen(
                  title: 'Konfiguratsiya xatosi',
                  message: configError,
                )
              : !_controller.initialized
                  ? const _StatusScreen(
                      title: 'Damastic',
                      message: 'Sessiya tekshirilmoqda...',
                    )
                  : _controller.isAuthenticated
                      ? MainScreen(controller: _controller)
                      : LoginScreen(controller: _controller),
        );
      },
    );
  }
}

class _StatusScreen extends StatelessWidget {
  const _StatusScreen({
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    message,
                    style: const TextStyle(
                      color: Color(0xFF7FA0D9),
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
