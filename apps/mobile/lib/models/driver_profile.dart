import '../core/utils/json_parsing.dart';
import 'driver_location_model.dart';
import 'route_model.dart';

class DriverProfile {
  const DriverProfile({
    required this.id,
    required this.name,
    required this.phone,
    required this.status,
    required this.carNumber,
    required this.cardNumber,
    required this.route,
    required this.location,
  });

  final String id;
  final String name;
  final String phone;
  final String status;
  final String carNumber;
  final String? cardNumber;
  final DamasticRouteModel? route;
  final DriverLocationModel? location;

  bool get isOnline => status == 'online';

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      id: parseString(json['id']),
      name: parseString(json['name']),
      phone: parseString(json['phone']),
      status: parseString(json['status'], 'offline'),
      carNumber: parseString(json['carNumber']),
      cardNumber: json['cardNumber'] == null
          ? null
          : parseString(json['cardNumber']),
      route: json['route'] == null
          ? null
          : DamasticRouteModel.fromJson(ensureMap(json['route'])),
      location: json['location'] == null
          ? null
          : DriverLocationModel.fromJson(ensureMap(json['location'])),
    );
  }

  DriverProfile copyWith({
    String? name,
    String? phone,
    String? status,
    String? carNumber,
    String? cardNumber,
    DamasticRouteModel? route,
    DriverLocationModel? location,
    bool clearLocation = false,
  }) {
    return DriverProfile(
      id: id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      status: status ?? this.status,
      carNumber: carNumber ?? this.carNumber,
      cardNumber: cardNumber ?? this.cardNumber,
      route: route ?? this.route,
      location: clearLocation ? null : (location ?? this.location),
    );
  }
}
