import '../core/utils/json_parsing.dart';

class DriverLocationModel {
  const DriverLocationModel({
    required this.lat,
    required this.lng,
    this.updatedAt,
  });

  final double lat;
  final double lng;
  final DateTime? updatedAt;

  factory DriverLocationModel.fromJson(Map<String, dynamic> json) {
    return DriverLocationModel(
      lat: parseDouble(json['lat']),
      lng: parseDouble(json['lng']),
      updatedAt: parseDateTime(json['updatedAt']),
    );
  }
}
