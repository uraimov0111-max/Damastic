import '../core/utils/json_parsing.dart';

class DriverMarker {
  const DriverMarker({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.status,
    required this.routeId,
  });

  final String id;
  final String name;
  final double lat;
  final double lng;
  final String status;
  final String? routeId;

  factory DriverMarker.fromJson(Map<String, dynamic> json) {
    return DriverMarker(
      id: parseString(json['driverId']),
      name: parseString(json['name']),
      lat: parseDouble(json['lat']),
      lng: parseDouble(json['lng']),
      status: parseString(json['status'], 'offline'),
      routeId: json['routeId'] == null ? null : parseString(json['routeId']),
    );
  }
}
