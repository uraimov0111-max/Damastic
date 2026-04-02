import '../core/utils/json_parsing.dart';

class QueueSnapshot {
  const QueueSnapshot({
    required this.point,
    required this.total,
    required this.entries,
  });

  final QueuePointInfo point;
  final int total;
  final List<QueueEntry> entries;

  factory QueueSnapshot.fromJson(Map<String, dynamic> json) {
    return QueueSnapshot(
      point: QueuePointInfo.fromJson(ensureMap(json['point'])),
      total: parseInt(json['total']),
      entries: ensureList(json['entries'])
          .map(QueueEntry.fromJson)
          .toList(growable: false),
    );
  }
}

class QueuePointInfo {
  const QueuePointInfo({
    required this.id,
    required this.routeId,
    required this.routeName,
    required this.name,
    required this.lat,
    required this.lng,
    required this.radius,
  });

  final String id;
  final String routeId;
  final String routeName;
  final String name;
  final double lat;
  final double lng;
  final int radius;

  factory QueuePointInfo.fromJson(Map<String, dynamic> json) {
    return QueuePointInfo(
      id: parseString(json['id']),
      routeId: parseString(json['routeId']),
      routeName: parseString(json['routeName']),
      name: parseString(json['name']),
      lat: parseDouble(json['lat']),
      lng: parseDouble(json['lng']),
      radius: parseInt(json['radius']),
    );
  }
}

class QueueEntry {
  const QueueEntry({
    required this.queueId,
    required this.driverId,
    required this.driverName,
    required this.carNumber,
    required this.position,
    required this.createdAt,
  });

  final String queueId;
  final String driverId;
  final String driverName;
  final String carNumber;
  final int position;
  final DateTime? createdAt;

  factory QueueEntry.fromJson(Map<String, dynamic> json) {
    return QueueEntry(
      queueId: parseString(json['queueId']),
      driverId: parseString(json['driverId']),
      driverName: parseString(json['driverName']),
      carNumber: parseString(json['carNumber']),
      position: parseInt(json['position']),
      createdAt: parseDateTime(json['createdAt']),
    );
  }
}

class QueuePosition {
  const QueuePosition({
    required this.active,
    this.queueId,
    this.position,
    this.pointId,
    this.pointName,
  });

  final bool active;
  final String? queueId;
  final int? position;
  final String? pointId;
  final String? pointName;

  factory QueuePosition.fromJson(Map<String, dynamic> json) {
    final active = json['active'] == true;
    final point = ensureMap(json['point']);

    return QueuePosition(
      active: active,
      queueId: active ? parseString(json['queueId']) : null,
      position: active ? parseInt(json['position']) : null,
      pointId: active ? parseString(point['id']) : null,
      pointName: active ? parseString(point['name']) : null,
    );
  }
}
