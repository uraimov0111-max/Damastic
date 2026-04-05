import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/config/app_config.dart';
import '../../state/app_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    required this.controller,
    super.key,
  });

  final AppController controller;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.controller.codeRequested) {
      await widget.controller.verifyCode(_codeController.text);
      return;
    }

    await widget.controller.sendCode(_phoneController.text);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final errorMessage = widget.controller.errorMessage;
        final infoMessage = widget.controller.infoMessage;
        final busy = widget.controller.busy;

        return Scaffold(
          body: DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF08111E),
                  Color(0xFF06101A),
                  Color(0xFF03070E),
                ],
              ),
            ),
            child: SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 24),
                        Row(
                          children: const [
                            Text(
                              '9:41',
                              style: TextStyle(
                                color: Color(0xFF7FA0D9),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Spacer(),
                            Text(
                              'WiFi 87%',
                              style: TextStyle(
                                color: Color(0xFF7FA0D9),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Center(
                          child: Container(
                            width: 108,
                            height: 108,
                            decoration: BoxDecoration(
                              color: const Color(0xFF12D18E),
                              borderRadius: BorderRadius.circular(28),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x5512D18E),
                                  blurRadius: 28,
                                  spreadRadius: 4,
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.airport_shuttle_rounded,
                                size: 48,
                                color: Colors.black,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 28),
                        const Center(
                          child: Text(
                            'DAMASTIC.UZ',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Center(
                          child: Text(
                            'Haydovchi ilovasi',
                            style: TextStyle(
                              color: Color(0xFF7FA0D9),
                              fontSize: 15,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          widget.controller.codeRequested
                              ? 'SMS KOD'
                              : 'TELEFON RAQAM',
                          style: TextStyle(
                            color: Color(0xFF6F88B6),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2.2,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 18),
                          decoration: BoxDecoration(
                            color: const Color(0xFF121C2F),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF223453)),
                          ),
                          child: Row(
                            children: [
                              if (!widget.controller.codeRequested) ...[
                                const Text(
                                  'UZ',
                                  style: TextStyle(
                                    color: Color(0xFF667A9F),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  '+998',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 26,
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Expanded(
                                child: TextField(
                                  controller: widget.controller.codeRequested
                                      ? _codeController
                                      : _phoneController,
                                  keyboardType: widget.controller.codeRequested
                                      ? TextInputType.number
                                      : TextInputType.phone,
                                  autofillHints: widget.controller.codeRequested
                                      ? const [AutofillHints.oneTimeCode]
                                      : const [AutofillHints.telephoneNumber],
                                  inputFormatters: widget.controller.codeRequested
                                      ? [
                                          FilteringTextInputFormatter.digitsOnly,
                                          LengthLimitingTextInputFormatter(6),
                                        ]
                                      : [
                                          FilteringTextInputFormatter.allow(
                                            RegExp(r'[\d+]'),
                                          ),
                                        ],
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: widget.controller.codeRequested
                                        ? '123456'
                                        : '90 123 45 67',
                                    border: InputBorder.none,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (widget.controller.codeRequested &&
                            AppConfig.exposeDebugAuthCode &&
                            widget.controller.debugCode != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            'Debug kod: ${widget.controller.debugCode}',
                            style: const TextStyle(
                              color: Color(0xFF7FA0D9),
                              fontSize: 12,
                            ),
                          ),
                        ],
                        if (infoMessage != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            infoMessage,
                            style: const TextStyle(
                              color: Color(0xFF12D18E),
                              fontSize: 13,
                            ),
                          ),
                        ],
                        if (errorMessage != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            errorMessage,
                            style: const TextStyle(
                              color: Color(0xFFFF6B6B),
                              fontSize: 13,
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          height: 62,
                          child: FilledButton(
                            onPressed: busy ? null : _submit,
                            child: Text(
                              busy
                                  ? 'Yuklanmoqda...'
                                  : widget.controller.codeRequested
                                      ? 'KIRISH'
                                      : 'SMS KOD YUBORISH',
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          widget.controller.codeRequested
                              ? 'Telefoningizga yuborilgan kodni kiriting.'
                              : 'Kirish uchun telefon raqamingizni yuboring.',
                          style: const TextStyle(
                            color: Color(0xFF6F88B6),
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
