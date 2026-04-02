import '../core/utils/json_parsing.dart';
import 'route_point_model.dart';

class DamasticRouteModel {
  const DamasticRouteModel({
    required this.id,
    required this.name,
    required this.price,
    required this.points,
  });

  final String id;
  final String name;
  final int price;
  final List<RoutePointModel> points;

  factory DamasticRouteModel.fromJson(Map<String, dynamic> json) {
    return DamasticRouteModel(
      id: parseString(json['id']),
      name: parseString(json['name']),
      price: parseInt(json['price']),
      points: ensureList(json['points'])
          .map(
            (item) => RoutePointModel.fromJson(
              item,
              routeId: parseString(json['id']),
            ),
          )
          .toList(growable: false),
    );
  }
}
