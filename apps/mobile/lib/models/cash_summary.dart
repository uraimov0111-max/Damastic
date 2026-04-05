import '../core/utils/json_parsing.dart';

class CashSummary {
  const CashSummary({
    required this.entriesToday,
    required this.passengersToday,
    required this.cashToday,
    required this.walletBalance,
  });

  final int entriesToday;
  final int passengersToday;
  final int cashToday;
  final int walletBalance;

  factory CashSummary.fromJson(Map<String, dynamic> json) {
    return CashSummary(
      entriesToday: parseInt(json['entriesToday']),
      passengersToday: parseInt(json['passengersToday']),
      cashToday: parseInt(json['cashToday']),
      walletBalance: parseInt(json['walletBalance']),
    );
  }
}
