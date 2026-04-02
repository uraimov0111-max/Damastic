import '../core/utils/json_parsing.dart';
import 'driver_profile.dart';

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.driver,
  });

  final String accessToken;
  final DriverProfile driver;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      accessToken: parseString(json['accessToken']),
      driver: DriverProfile.fromJson(ensureMap(json['driver'])),
    );
  }

  AuthSession copyWith({
    String? accessToken,
    DriverProfile? driver,
  }) {
    return AuthSession(
      accessToken: accessToken ?? this.accessToken,
      driver: driver ?? this.driver,
    );
  }
}
