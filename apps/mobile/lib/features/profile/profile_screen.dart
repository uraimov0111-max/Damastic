import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          Text('Profil', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          SizedBox(height: 16),
          Card(child: ListTile(title: Text('Abdullayev Ulugbek'), subtitle: Text('+998901234567'))),
          Card(child: ListTile(title: Text('Mashina'), subtitle: Text('10A111UZ'))),
          Card(child: ListTile(title: Text('Karta'), subtitle: Text('8600123412341234'))),
        ],
      ),
    );
  }
}
