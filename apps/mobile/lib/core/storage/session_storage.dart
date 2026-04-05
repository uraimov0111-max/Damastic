import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionStorage {
  SessionStorage({
    FlutterSecureStorage? storage,
  }) : _storage = storage ?? const FlutterSecureStorage();

  static const _accessTokenKey = 'damastic_access_token';

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() async {
    try {
      return await _storage.read(key: _accessTokenKey);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveAccessToken(String token) async {
    try {
      await _storage.write(key: _accessTokenKey, value: token);
    } catch (_) {
      // Storage fallback is intentionally silent on unsupported platforms.
    }
  }

  Future<void> clear() async {
    try {
      await _storage.delete(key: _accessTokenKey);
    } catch (_) {
      // Storage fallback is intentionally silent on unsupported platforms.
    }
  }
}
