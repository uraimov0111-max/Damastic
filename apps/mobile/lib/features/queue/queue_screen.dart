import 'package:flutter/material.dart';

class QueueScreen extends StatelessWidget {
  const QueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          Text('A punkt navbati', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          SizedBox(height: 16),
          _QueueTile(position: 1, label: 'Damas'),
          _QueueTile(position: 2, label: 'Damas'),
          _QueueTile(position: 3, label: 'Damas'),
          _QueueTile(position: 4, label: 'Siz'),
        ],
      ),
    );
  }
}

class _QueueTile extends StatelessWidget {
  final int position;
  final String label;

  const _QueueTile({required this.position, required this.label});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(child: Text('$position')),
        title: Text('$position $label'),
      ),
    );
  }
}
