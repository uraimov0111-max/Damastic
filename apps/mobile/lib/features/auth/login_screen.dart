import 'package:flutter/material.dart';
import '../main/main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController(text: '+998901234567');
  final _codeController = TextEditingController();
  bool _codeStep = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              const FlutterLogo(size: 84),
              const SizedBox(height: 24),
              const Center(
                child: Text(
                  'DAMASTIC.UZ',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 8),
              const Center(child: Text('Haydovchi ilovasi')),
              const Spacer(),
              TextField(
                controller: _codeStep ? _codeController : _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: _codeStep ? 'SMS kod' : 'Telefon raqam',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () {
                  if (_codeStep) {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const MainScreen()),
                    );
                    return;
                  }

                  setState(() => _codeStep = true);
                },
                child: Text(_codeStep ? 'Kirish' : 'SMS kod yuborish'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
