import 'package:flutter/material.dart';
import '../profile/profile_screen.dart';
import '../qr/qr_screen.dart';
import '../queue/queue_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _index = 0;

  static const _pages = [
    _MainDashboard(),
    QueueScreen(),
    QrScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Asosiy'),
          NavigationDestination(icon: Icon(Icons.format_list_numbered), label: 'Navbat'),
          NavigationDestination(icon: Icon(Icons.qr_code_2), label: 'QR'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profil'),
        ],
      ),
    );
  }
}

class _MainDashboard extends StatelessWidget {
  const _MainDashboard();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('ISHDA <-> UYDA', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Container(
            height: 240,
            decoration: BoxDecoration(
              color: const Color(0xFF111B2D),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text('Google Maps SDK joyi'),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: () {},
                  child: const Text('NAVBAT OLISH'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.tonal(
                  onPressed: () {},
                  child: const Text("QR KO'RSATISH"),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
