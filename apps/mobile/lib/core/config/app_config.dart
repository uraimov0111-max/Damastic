class AppConfig {
  const AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api',
  );

  static const String socketBaseUrl = String.fromEnvironment(
    'SOCKET_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/realtime',
  );

  static const double defaultMapLat = 41.311081;
  static const double defaultMapLng = 69.240562;
  static const int networkTimeoutMs = 15000;
}
