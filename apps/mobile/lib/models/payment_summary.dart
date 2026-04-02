import '../core/utils/json_parsing.dart';

class PaymentSummary {
  const PaymentSummary({
    required this.success,
    required this.pending,
    required this.failed,
    required this.totalPaid,
  });

  final int success;
  final int pending;
  final int failed;
  final int totalPaid;

  factory PaymentSummary.fromJson(Map<String, dynamic> json) {
    return PaymentSummary(
      success: parseInt(json['success']),
      pending: parseInt(json['pending']),
      failed: parseInt(json['failed']),
      totalPaid: parseInt(json['totalPaid']),
    );
  }
}
