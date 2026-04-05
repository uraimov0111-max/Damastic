import 'package:damastic_mobile/core/storage/session_storage.dart';
import 'package:damastic_mobile/features/auth/login_screen.dart';
import 'package:damastic_mobile/state/app_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _TestSessionStorage extends SessionStorage {
  _TestSessionStorage();

  @override
  Future<String?> readAccessToken() async => null;

  @override
  Future<void> saveAccessToken(String token) async {}

  @override
  Future<void> clear() async {}
}

void main() {
  testWidgets('login screen renders', (WidgetTester tester) async {
    final controller = AppController(
      sessionStorage: _TestSessionStorage(),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(controller: controller),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('DAMASTIC.UZ'), findsOneWidget);
    expect(find.text('Haydovchi ilovasi'), findsOneWidget);
    expect(find.text('SMS KOD YUBORISH'), findsOneWidget);
  });
}
