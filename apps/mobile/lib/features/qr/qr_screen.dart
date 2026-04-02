import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class QrScreen extends StatelessWidget {
  const QrScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('SCAN QILING', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            QrImageView(
              data: 'https://pay.damastic.uz/driver/driver-1',
              size: 240,
              backgroundColor: Colors.white,
            ),
            const SizedBox(height: 16),
            const Text("5000 so'm", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
