import '../core/utils/json_parsing.dart';

class RoutePointModel {
  const RoutePointModel({
    required this.id,
    required this.routeId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.radius,
  });

  final String id;
  final String routeId;
  final String name;
  final double lat;
  final double lng;
  final int radius;

  factory RoutePointModel.fromJson(
    Map<String, dynamic> json, {
    String? routeId,
  }) {
    return RoutePointModel(
      id: parseString(json['id']),
      routeId: routeId ?? parseString(json['routeId']),
      name: parseString(json['name']),
      lat: parseDouble(json['lat']),
      lng: parseDouble(json['lng']),
      radius: parseInt(json['radius']),
    );
  }
}
