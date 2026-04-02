import '../core/utils/json_parsing.dart';

class PaymentLink {
  const PaymentLink({
    required this.driverId,
    required this.amount,
    required this.payLink,
    required this.qrPayload,
    required this.systems,
  });

  final String driverId;
  final int amount;
  final String payLink;
  final String qrPayload;
  final List<String> systems;

  factory PaymentLink.fromJson(Map<String, dynamic> json) {
    final rawSystems = json['systems'];
    final systems = rawSystems is List
        ? rawSystems.map((item) => item.toString()).toList(growable: false)
        : const <String>[];

    return PaymentLink(
      driverId: parseString(json['driverId']),
      amount: parseInt(json['amount']),
      payLink: parseString(json['payLink']),
      qrPayload: parseString(json['qrPayload']),
      systems: systems,
    );
  }
}
