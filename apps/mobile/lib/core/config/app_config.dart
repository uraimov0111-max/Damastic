import 'package:flutter/foundation.dart';

class AppConfig {
  const AppConfig._();

  static const String _defaultApiBaseUrl = 'http://10.0.2.2:4000/api';
  static const String _defaultSocketBaseUrl = 'http://10.0.2.2:4000/realtime';
  static const String _configuredApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );
  static const String _configuredSocketBaseUrl = String.fromEnvironment(
    'SOCKET_BASE_URL',
    defaultValue: '',
  );
  static const bool _configuredExposeDebugAuthCode = bool.fromEnvironment(
    'EXPOSE_DEBUG_AUTH_CODE',
    defaultValue: false,
  );

  static String get apiBaseUrl =>
      _configuredApiBaseUrl.isNotEmpty
          ? _configuredApiBaseUrl
          : _defaultApiBaseUrl;

  static String get socketBaseUrl =>
      _configuredSocketBaseUrl.isNotEmpty
          ? _configuredSocketBaseUrl
          : _defaultSocketBaseUrl;

  static bool get exposeDebugAuthCode =>
      !kReleaseMode && _configuredExposeDebugAuthCode;

  static String? get validationError {
    if (!kReleaseMode) {
      return null;
    }

    final issues = <String>[];

    final apiIssue = _validateEndpoint(
      apiBaseUrl,
      expectedScheme: 'https',
      environmentName: 'API_BASE_URL',
    );
    if (apiIssue != null) {
      issues.add(apiIssue);
    }

    final socketIssue = _validateEndpoint(
      socketBaseUrl,
      expectedScheme: 'wss',
      environmentName: 'SOCKET_BASE_URL',
    );
    if (socketIssue != null) {
      issues.add(socketIssue);
    }

    if (issues.isEmpty) {
      return null;
    }

    return issues.join('\n');
  }

  static const double defaultMapLat = 41.311081;
  static const double defaultMapLng = 69.240562;
  static const int networkTimeoutMs = 15000;

  static String? _validateEndpoint(
    String value, {
    required String expectedScheme,
    required String environmentName,
  }) {
    final uri = Uri.tryParse(value);
    if (uri == null || uri.host.isEmpty) {
      return '$environmentName noto‘g‘ri formatda berilgan.';
    }

    if (uri.scheme != expectedScheme) {
      return '$environmentName release build uchun $expectedScheme bo‘lishi kerak.';
    }

    if (_isLocalHost(uri.host)) {
      return '$environmentName local yoki private hostga qaramasligi kerak.';
    }

    return null;
  }

  static bool _isLocalHost(String host) {
    const privateIpv4Pattern =
        r'^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)';

    return host == 'localhost' ||
        host == '10.0.2.2' ||
        RegExp(privateIpv4Pattern).hasMatch(host);
  }
}
