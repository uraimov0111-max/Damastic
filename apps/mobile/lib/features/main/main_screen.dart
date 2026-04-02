import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/config/app_config.dart';
import '../../state/app_controller.dart';
import '../profile/profile_screen.dart';
import '../qr/qr_screen.dart';
import '../queue/queue_screen.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({
    required this.controller,
    super.key,
  });

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final pages = [
          _MainDashboard(controller: controller),
          QueueScreen(controller: controller),
          QrScreen(controller: controller),
          ProfileScreen(controller: controller),
        ];

        return Scaffold(
          body: pages[controller.currentTab],
          bottomNavigationBar: NavigationBar(
            selectedIndex: controller.currentTab,
            onDestinationSelected: controller.setCurrentTab,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.map_outlined),
                label: 'Asosiy',
              ),
              NavigationDestination(
                icon: Icon(Icons.format_list_numbered),
                label: 'Navbat',
              ),
              NavigationDestination(
                icon: Icon(Icons.qr_code_2),
                label: 'QR',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                label: 'Profil',
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MainDashboard extends StatelessWidget {
  const _MainDashboard({
    required this.controller,
  });

  final AppController controller;

  Set<Marker> _buildMarkers() {
    final markers = <Marker>{};

    for (final point in controller.currentRoutePoints) {
      markers.add(
        Marker(
          markerId: MarkerId('point-${point.id}'),
          position: LatLng(point.lat, point.lng),
          infoWindow: InfoWindow(
            title: point.name,
            snippet: 'Radius: ${point.radius} metr',
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            point.id == controller.selectedPointId
                ? BitmapDescriptor.hueGreen
                : BitmapDescriptor.hueAzure,
          ),
          onTap: () {
            controller.selectPoint(point.id);
          },
        ),
      );
    }

    for (final driver in controller.driverMarkersForCurrentRoute) {
      markers.add(
        Marker(
          markerId: MarkerId('driver-${driver.id}'),
          position: LatLng(driver.lat, driver.lng),
          infoWindow: InfoWindow(
            title: driver.name,
            snippet: driver.status.toUpperCase(),
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            driver.status == 'online'
                ? BitmapDescriptor.hueGreen
                : BitmapDescriptor.hueOrange,
          ),
        ),
      );
    }

    final selfLocation = controller.driver?.location;
    if (selfLocation != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('self'),
          position: LatLng(selfLocation.lat, selfLocation.lng),
          infoWindow: const InfoWindow(title: 'Siz'),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueBlue,
          ),
        ),
      );
    }

    return markers;
  }

  @override
  Widget build(BuildContext context) {
    final selectedPoint = controller.selectedPoint;
    final initialTarget = selectedPoint != null
        ? LatLng(selectedPoint.lat, selectedPoint.lng)
        : const LatLng(AppConfig.defaultMapLat, AppConfig.defaultMapLng);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: controller.refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        controller.driver?.name ?? 'Haydovchi',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        controller.driver?.route?.name ?? 'Marshrut biriktirilmagan',
                        style: const TextStyle(color: Color(0xFF7FA0D9)),
                      ),
                    ],
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: controller.socketConnected
                        ? const Color(0x2212D18E)
                        : const Color(0x22FFB020),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    child: Text(
                      controller.socketConnected ? 'Realtime ulangan' : 'Realtime uzilgan',
                      style: TextStyle(
                        color: controller.socketConnected
                            ? const Color(0xFF12D18E)
                            : const Color(0xFFFFB020),
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF07282B),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF0FAE81)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          controller.isOnline ? 'ISHDA' : 'UYDA',
                          style: const TextStyle(
                            color: Color(0xFF12D18E),
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          controller.isOnline
                              ? "Navbat olish va xarita ko'rish faol."
                              : "Navbat va GPS oqimlari uchun online holat kerak.",
                          style: const TextStyle(color: Color(0xFF9FDAC8)),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: controller.isOnline,
                    onChanged: controller.busy ? null : controller.toggleStatus,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 320,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: initialTarget,
                    zoom: 14.4,
                  ),
                  markers: _buildMarkers(),
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  compassEnabled: false,
                  mapToolbarEnabled: false,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Punktlar',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
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
            const SizedBox(height: 16),
            if (controller.queuePosition.active)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF111B2D),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.format_list_numbered, color: Color(0xFF12D18E)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        "${controller.queuePosition.pointName ?? 'Punkt'} navbatida ${controller.queuePosition.position}-o'rindasiz",
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            if (controller.errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                controller.errorMessage!,
                style: const TextStyle(color: Color(0xFFFF6B6B)),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 60,
                    child: FilledButton(
                      onPressed: controller.busy
                          ? null
                          : controller.queuePosition.active
                              ? controller.leaveQueue
                              : controller.joinSelectedPointQueue,
                      child: Text(
                        controller.queuePosition.active
                            ? 'NAVBATNI TARK ETISH'
                            : 'NAVBAT OLISH',
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 60,
                    child: FilledButton.tonal(
                      onPressed: () => controller.setCurrentTab(2),
                      child: const Text("QR KO'RSATISH"),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              controller.driver?.location == null
                  ? "Navbat olishdan oldin qurilma GPS lokatsiyasi backendga yuborilishi kerak."
                  : "Oxirgi GPS: ${controller.driver!.location!.lat.toStringAsFixed(5)}, ${controller.driver!.location!.lng.toStringAsFixed(5)}",
              style: const TextStyle(
                color: Color(0xFF7FA0D9),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }
}
