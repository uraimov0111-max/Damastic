import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../state/app_controller.dart';

class QrScreen extends StatelessWidget {
  const QrScreen({
    required this.controller,
    super.key,
  });

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final paymentLink = controller.paymentLink;
        final paymentSummary = controller.paymentSummary;
        final cashSummary = controller.cashSummary;

        return SafeArea(
          child: RefreshIndicator(
            onRefresh: () async {
              await controller.loadPaymentData();
              await controller.loadCashSummary();
            },
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  "QR To'lov",
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Yo'lovchi Click yoki Payme orqali to'lov qiladi.",
                  style: TextStyle(color: Color(0xFF7FA0D9)),
                ),
                const SizedBox(height: 24),
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: QrImageView(
                      data: paymentLink?.qrPayload ?? 'https://pay.damastic.uz',
                      size: 240,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: Text(
                    '${paymentLink?.amount ?? 0} so\'m',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                if (paymentLink != null)
                  SelectableText(
                    paymentLink.payLink,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFF7FA0D9)),
                  ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _MetricCard(
                      label: 'Success',
                      value: '${paymentSummary?.success ?? 0}',
                    ),
                    _MetricCard(
                      label: 'Pending',
                      value: '${paymentSummary?.pending ?? 0}',
                    ),
                    _MetricCard(
                      label: 'Failed',
                      value: '${paymentSummary?.failed ?? 0}',
                    ),
                    _MetricCard(
                      label: 'Jami',
                      value: '${paymentSummary?.totalPaid ?? 0} so\'m',
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Text(
                  'Naqd tushum',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Yo'lovchi naqd to'lasa, passenger count kiriting.",
                  style: TextStyle(color: Color(0xFF7FA0D9)),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _PassengerButton(controller: controller, count: 1),
                    _PassengerButton(controller: controller, count: 2),
                    _PassengerButton(controller: controller, count: 3),
                    _PassengerButton(controller: controller, count: 4),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _MetricCard(
                      label: 'Naqd yozuv',
                      value: '${cashSummary?.entriesToday ?? 0}',
                    ),
                    _MetricCard(
                      label: 'Yo\'lovchi',
                      value: '${cashSummary?.passengersToday ?? 0}',
                    ),
                    _MetricCard(
                      label: 'Naqd bugun',
                      value: '${cashSummary?.cashToday ?? 0} so\'m',
                    ),
                    _MetricCard(
                      label: 'Wallet',
                      value: '${cashSummary?.walletBalance ?? 0} so\'m',
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                FilledButton.tonal(
                  onPressed: controller.busy
                      ? null
                      : () async {
                          await controller.loadPaymentData();
                          await controller.loadCashSummary();
                        },
                  child: const Text("To'lov va naqd ma'lumotini yangilash"),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PassengerButton extends StatelessWidget {
  const _PassengerButton({
    required this.controller,
    required this.count,
  });

  final int count;
  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: FilledButton(
        onPressed: controller.busy ? null : () => controller.recordCashEntry(count),
        child: Text('$count ta yo\'lovchi'),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111B2D),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF7FA0D9))),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
        ],
      ),
    );
  }
}
