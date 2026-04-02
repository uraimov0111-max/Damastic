import 'package:flutter/material.dart';
import '../../state/app_controller.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({
    required this.controller,
    super.key,
  });

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final driver = controller.driver;

        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'Profil',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              _ProfileCard(
                title: driver?.name ?? 'Haydovchi',
                subtitle: driver?.phone ?? '-',
                trailing: controller.isOnline ? 'ONLINE' : 'OFFLINE',
              ),
              _ProfileCard(
                title: 'Mashina raqami',
                subtitle: driver?.carNumber ?? '-',
              ),
              _ProfileCard(
                title: 'Karta raqami',
                subtitle: driver?.cardNumber ?? 'Biriktirilmagan',
              ),
              _ProfileCard(
                title: 'Marshrut',
                subtitle: driver?.route?.name ?? 'Biriktirilmagan',
              ),
              _ProfileCard(
                title: 'Backend',
                subtitle: controller.apiBaseUrl,
              ),
              _ProfileCard(
                title: 'Socket',
                subtitle: controller.socketBaseUrl,
              ),
              const SizedBox(height: 12),
              FilledButton.tonal(
                onPressed: controller.busy ? null : controller.refreshAll,
                child: const Text('Ma\'lumotni yangilash'),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: controller.logout,
                child: const Text('Chiqish'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: trailing == null
            ? null
            : Text(
                trailing!,
                style: const TextStyle(
                  color: Color(0xFF12D18E),
                  fontWeight: FontWeight.w700,
                ),
              ),
      ),
    );
  }
}
