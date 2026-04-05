import 'package:flutter/material.dart';
import '../../state/app_controller.dart';

class QueueScreen extends StatelessWidget {
  const QueueScreen({
    required this.controller,
    super.key,
  });

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final snapshot = controller.queueSnapshot;

        return SafeArea(
          child: RefreshIndicator(
            onRefresh: controller.refreshQueue,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  'Navbat',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  snapshot?.point.name ??
                      controller.selectedPoint?.name ??
                      'Punkt tanlanmagan',
                  style: const TextStyle(color: Color(0xFF7FA0D9), fontSize: 16),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    for (final point in controller.currentRoutePoints)
                      ChoiceChip(
                        selected: point.id == controller.selectedPointId,
                        label: Text(point.name),
                        onSelected: (_) {
                          controller.selectPoint(point.id);
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111B2D),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Jami navbat: ${snapshot?.total ?? 0} ta damas',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        controller.queuePosition.active
                            ? "Sizning o'rningiz: ${controller.queuePosition.position}"
                            : 'Siz hozir aktiv navbatda emassiz.',
                        style: const TextStyle(color: Color(0xFF7FA0D9)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                if (snapshot == null || snapshot.entries.isEmpty)
                  const _EmptyQueueState()
                else
                  ...snapshot.entries.map(
                    (entry) => _QueueTile(
                      position: entry.position,
                      label: entry.driverName,
                      caption: entry.carNumber,
                      active: entry.driverId == controller.driver?.id,
                    ),
                  ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.tonal(
                        onPressed: controller.busy ? null : controller.refreshQueue,
                        child: const Text('Yangilash'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: controller.busy
                            ? null
                            : controller.queuePosition.active
                                ? controller.leaveQueue
                                : controller.joinSelectedPointQueue,
                        child: Text(
                          controller.queuePosition.active
                              ? 'Tark etish'
                              : 'Navbat olish',
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _EmptyQueueState extends StatelessWidget {
  const _EmptyQueueState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF111B2D),
        borderRadius: BorderRadius.circular(22),
      ),
      child: const Text(
        'Tanlangan punkt uchun aktiv navbat topilmadi.',
        style: TextStyle(color: Color(0xFF7FA0D9)),
      ),
    );
  }
}

class _QueueTile extends StatelessWidget {
  const _QueueTile({
    required this.position,
    required this.label,
    required this.caption,
    required this.active,
  });

  final int position;
  final String label;
  final String caption;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(child: Text('$position')),
        title: Text('$position. $label'),
        subtitle: Text(caption),
        trailing: active
            ? const Icon(Icons.radio_button_checked, color: Color(0xFF12D18E))
            : null,
      ),
    );
  }
}
