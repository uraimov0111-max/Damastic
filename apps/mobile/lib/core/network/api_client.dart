import 'package:dio/dio.dart';
import '../../models/auth_session.dart';
import '../../models/driver_profile.dart';
import '../../models/payment_link.dart';
import '../../models/payment_summary.dart';
import '../../models/queue_snapshot.dart';
import '../../models/route_model.dart';
import '../config/app_config.dart';
import '../utils/json_parsing.dart';

class ApiClient {
  ApiClient()
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(milliseconds: AppConfig.networkTimeoutMs),
            receiveTimeout: const Duration(milliseconds: AppConfig.networkTimeoutMs),
            headers: const {'Accept': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_accessToken != null && _accessToken!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
          }

          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  String? _accessToken;

  String get baseUrl => _dio.options.baseUrl;

  void setAccessToken(String? value) {
    _accessToken = value;
  }

  Future<Map<String, dynamic>> sendCode(String phone) async {
    final response = await _dio.post('/auth/send-code', data: {'phone': phone});
    return ensureMap(response.data);
  }

  Future<AuthSession> verifyCode(String phone, String code) async {
    final response = await _dio.post(
      '/auth/verify-code',
      data: {
        'phone': phone,
        'code': code,
      },
    );

    return AuthSession.fromJson(ensureMap(response.data));
  }

  Future<DriverProfile> getMe() async {
    final response = await _dio.get('/drivers/me');
    return DriverProfile.fromJson(ensureMap(response.data));
  }

  Future<DriverProfile> updateStatus(bool isOnline) async {
    final response = await _dio.patch(
      '/drivers/status',
      data: {'status': isOnline ? 'online' : 'offline'},
    );

    final payload = ensureMap(response.data);
    return DriverProfile(
      id: parseString(payload['id']),
      name: '',
      phone: '',
      status: parseString(payload['status']),
      carNumber: '',
      cardNumber: null,
      route: null,
      location: null,
    );
  }

  Future<List<DamasticRouteModel>> getRoutes() async {
    final response = await _dio.get('/routes');
    return ensureList(response.data)
        .map(DamasticRouteModel.fromJson)
        .toList(growable: false);
  }

  Future<Map<String, dynamic>> updateLocation({
    required double lat,
    required double lng,
  }) async {
    final response = await _dio.post(
      '/locations',
      data: {
        'lat': lat,
        'lng': lng,
      },
    );

    return ensureMap(response.data);
  }

  Future<Map<String, dynamic>> joinQueue(String pointId) async {
    final response = await _dio.post('/queues/join', data: {'pointId': pointId});
    return ensureMap(response.data);
  }

  Future<Map<String, dynamic>> leaveQueue(String? pointId) async {
    final response = await _dio.post(
      '/queues/leave',
      data: pointId == null ? {} : {'pointId': pointId},
    );

    return ensureMap(response.data);
  }

  Future<QueueSnapshot> getQueueByPoint(String pointId) async {
    final response = await _dio.get('/queues/point/$pointId');
    return QueueSnapshot.fromJson(ensureMap(response.data));
  }

  Future<QueuePosition> getMyPosition() async {
    final response = await _dio.get('/queues/my-position');
    return QueuePosition.fromJson(ensureMap(response.data));
  }

  Future<PaymentLink> getDriverLink() async {
    final response = await _dio.get('/payments/driver-link');
    return PaymentLink.fromJson(ensureMap(response.data));
  }

  Future<PaymentSummary> getPaymentSummary() async {
    final response = await _dio.get('/payments/summary');
    return PaymentSummary.fromJson(ensureMap(response.data));
  }
}
