import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../core/network/socket_service.dart';
import '../core/storage/session_storage.dart';
import '../core/utils/json_parsing.dart';
import '../models/auth_session.dart';
import '../models/cash_summary.dart';
import '../models/driver_location_model.dart';
import '../models/driver_marker.dart';
import '../models/driver_profile.dart';
import '../models/payment_link.dart';
import '../models/payment_summary.dart';
import '../models/queue_snapshot.dart';
import '../models/route_model.dart';
import '../models/route_point_model.dart';

class AppController extends ChangeNotifier {
  AppController({
    ApiClient? apiClient,
    SocketService? socketService,
    SessionStorage? sessionStorage,
  })  : _apiClient = apiClient ?? ApiClient(),
        _socketService = socketService ?? SocketService(),
        _sessionStorage = sessionStorage ?? SessionStorage() {
    _bindSocketCallbacks();
    _restoreSession();
  }

  final ApiClient _apiClient;
  final SocketService _socketService;
  final SessionStorage _sessionStorage;

  AuthSession? _session;
  List<DamasticRouteModel> _routes = const [];
  QueueSnapshot? _queueSnapshot;
  QueuePosition _queuePosition = const QueuePosition(active: false);
  PaymentLink? _paymentLink;
  PaymentSummary? _paymentSummary;
  CashSummary? _cashSummary;
  List<DriverMarker> _driverMarkers = const [];
  String? _selectedPointId;
  String? _pendingPhone;
  String? _debugCode;
  String? _errorMessage;
  String? _infoMessage;
  bool _busy = false;
  bool _initialized = false;
  bool _codeRequested = false;
  bool _socketConnected = false;
  int _currentTab = 0;
  Timer? _locationTimer;
  bool _sendingLocation = false;

  bool get isAuthenticated => _session != null;
  bool get busy => _busy;
  bool get initialized => _initialized;
  bool get codeRequested => _codeRequested;
  bool get socketConnected => _socketConnected;
  bool get isOnline => driver?.status == 'online';
  int get currentTab => _currentTab;
  String? get debugCode => _debugCode;
  String? get errorMessage => _errorMessage;
  String? get infoMessage => _infoMessage;
  String get apiBaseUrl => AppConfig.apiBaseUrl;
  String get socketBaseUrl => AppConfig.socketBaseUrl;
  DriverProfile? get driver => _session?.driver;
  PaymentLink? get paymentLink => _paymentLink;
  PaymentSummary? get paymentSummary => _paymentSummary;
  CashSummary? get cashSummary => _cashSummary;
  QueueSnapshot? get queueSnapshot => _queueSnapshot;
  QueuePosition get queuePosition => _queuePosition;
  String? get selectedPointId => _selectedPointId;

  DamasticRouteModel? get currentRoute {
    final routeId = driver?.route?.id;
    if (routeId != null) {
      for (final route in _routes) {
        if (route.id == routeId) {
          return route;
        }
      }
    }

    if (_routes.isEmpty) {
      return null;
    }

    return _routes.first;
  }

  List<RoutePointModel> get currentRoutePoints {
    return currentRoute?.points ?? const <RoutePointModel>[];
  }

  RoutePointModel? get selectedPoint {
    final pointId = _selectedPointId;
    if (pointId == null) {
      return currentRoutePoints.isEmpty ? null : currentRoutePoints.first;
    }

    for (final point in currentRoutePoints) {
      if (point.id == pointId) {
        return point;
      }
    }

    return currentRoutePoints.isEmpty ? null : currentRoutePoints.first;
  }

  List<DriverMarker> get driverMarkersForCurrentRoute {
    final routeId = currentRoute?.id;
    if (routeId == null) {
      return _driverMarkers;
    }

    return _driverMarkers
        .where((driverMarker) => driverMarker.routeId == routeId)
        .toList(growable: false);
  }

  Future<void> sendCode(String phone) async {
    final normalizedPhone = _normalizePhone(phone);
    _pendingPhone = normalizedPhone;
    _setBusy(true);
    _clearMessages();

    try {
      final payload = await _apiClient.sendCode(normalizedPhone);
      _debugCode = payload['debugCode']?.toString();
      _codeRequested = true;
      _infoMessage = 'SMS kod yuborildi.';
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  Future<void> verifyCode(String code) async {
    if (_pendingPhone == null || _pendingPhone!.isEmpty) {
      _errorMessage = 'Avval telefon raqam yuborilishi kerak.';
      notifyListeners();
      return;
    }

    _setBusy(true);
    _clearMessages();

    try {
      final session = await _apiClient.verifyCode(_pendingPhone!, code.trim());
      _session = session;
      _apiClient.setAccessToken(session.accessToken);
      await _sessionStorage.saveAccessToken(session.accessToken);
      _codeRequested = false;
      _infoMessage = 'Kirish muvaffaqiyatli.';
      await refreshAll();
      _connectRealtime();
      await _ensureLocationTracking();
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  Future<void> refreshAll() async {
    if (!isAuthenticated) {
      return;
    }

    _setBusy(true);
    _clearMessages();

    try {
      await Future.wait([
        _loadProfile(),
        _loadRoutes(),
        loadPaymentData(),
        loadCashSummary(),
        _loadMyQueuePosition(),
      ]);

      if (_selectedPointId == null && currentRoutePoints.isNotEmpty) {
        _selectedPointId = currentRoutePoints.first.id;
      }

      if (_selectedPointId != null) {
        await refreshQueue();
      }
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  Future<void> refreshQueue() async {
    final pointId = _selectedPointId;
    if (!isAuthenticated || pointId == null) {
      return;
    }

    try {
      _queueSnapshot = await _apiClient.getQueueByPoint(pointId);
      await _loadMyQueuePosition();
    } catch (error) {
      _errorMessage = _resolveError(error);
      notifyListeners();
    } finally {
      notifyListeners();
    }
  }

  Future<void> loadPaymentData() async {
    if (!isAuthenticated) {
      return;
    }

    try {
      final values = await Future.wait<dynamic>([
        _apiClient.getDriverLink(),
        _apiClient.getPaymentSummary(),
      ]);

      _paymentLink = values[0] as PaymentLink;
      _paymentSummary = values[1] as PaymentSummary;
      notifyListeners();
    } catch (error) {
      _errorMessage = _resolveError(error);
      notifyListeners();
    }
  }

  Future<void> loadCashSummary() async {
    if (!isAuthenticated) {
      return;
    }

    try {
      _cashSummary = await _apiClient.getCashSummary();
      notifyListeners();
    } catch (error) {
      _errorMessage = _resolveError(error);
      notifyListeners();
    }
  }

  Future<void> toggleStatus(bool isOnline) async {
    if (!isAuthenticated || driver == null) {
      return;
    }

    _setBusy(true);
    _clearMessages();

    try {
      final statusPatch = await _apiClient.updateStatus(isOnline);
      _session = _session?.copyWith(
        driver: driver!.copyWith(status: statusPatch.status),
      );

      if (statusPatch.status == 'online') {
        await _ensureLocationTracking();
      } else {
        _stopLocationTracking();
      }
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  Future<void> selectPoint(String pointId) async {
    _selectedPointId = pointId;
    _queueSnapshot = null;
    _socketService.subscribeQueue(pointId);
    notifyListeners();
    await refreshQueue();
  }

  Future<void> joinSelectedPointQueue() async {
    final pointId = _selectedPointId;
    if (!isAuthenticated || pointId == null) {
      return;
    }

    _setBusy(true);
    _clearMessages();

    try {
      await _apiClient.joinQueue(pointId);
      _infoMessage = 'Navbat olindi.';
      await refreshQueue();
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  Future<void> leaveQueue() async {
    if (!isAuthenticated) {
      return;
    }

    _setBusy(true);
    _clearMessages();

    try {
      await _apiClient.leaveQueue(_queuePosition.pointId);
      _queuePosition = const QueuePosition(active: false);
      _infoMessage = 'Navbat tark etildi.';
      await refreshQueue();
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  Future<void> pushLocation({
    required double lat,
    required double lng,
  }) async {
    if (!isAuthenticated || driver == null || _sendingLocation) {
      return;
    }

    try {
      _sendingLocation = true;
      final payload = await _apiClient.updateLocation(lat: lat, lng: lng);
      final location = DriverLocationModel.fromJson(payload);
      _session = _session?.copyWith(
        driver: driver!.copyWith(location: location),
      );
      notifyListeners();
    } catch (error) {
      _errorMessage = _resolveError(error);
      notifyListeners();
    } finally {
      _sendingLocation = false;
    }
  }

  Future<void> recordCashEntry(int passengerCount) async {
    if (!isAuthenticated || passengerCount <= 0) {
      return;
    }

    _setBusy(true);
    _clearMessages();

    try {
      await _apiClient.createCashEntry(passengerCount);
      await Future.wait([
        loadCashSummary(),
        _loadProfile(),
      ]);
      _infoMessage = 'Naqd tushum saqlandi.';
    } catch (error) {
      _errorMessage = _resolveError(error);
    } finally {
      _setBusy(false);
    }
  }

  void setCurrentTab(int value) {
    _currentTab = value;
    notifyListeners();
  }

  void logout() {
    _stopLocationTracking();
    _socketService.disconnect();
    _session = null;
    _routes = const [];
    _queueSnapshot = null;
    _queuePosition = const QueuePosition(active: false);
    _paymentLink = null;
    _paymentSummary = null;
    _cashSummary = null;
    _driverMarkers = const [];
    _selectedPointId = null;
    _pendingPhone = null;
    _debugCode = null;
    _errorMessage = null;
    _infoMessage = null;
    _busy = false;
    _codeRequested = false;
    _socketConnected = false;
    _currentTab = 0;
    _apiClient.setAccessToken(null);
    unawaited(_sessionStorage.clear());
    notifyListeners();
  }

  @override
  void dispose() {
    _stopLocationTracking();
    _socketService.disconnect();
    super.dispose();
  }

  void _bindSocketCallbacks() {
    _socketService.onConnected = () {
      _socketConnected = true;
      _socketService.subscribeDrivers();

      if (_selectedPointId != null) {
        _socketService.subscribeQueue(_selectedPointId!);
      }

      notifyListeners();
    };

    _socketService.onDisconnected = () {
      _socketConnected = false;
      notifyListeners();
    };

    _socketService.onDriversUpdate = (payload) {
      final marker = DriverMarker.fromJson(payload);
      final next = _driverMarkers.toList(growable: true);
      final index = next.indexWhere((item) => item.id == marker.id);

      if (index >= 0) {
        next[index] = marker;
      } else {
        next.add(marker);
      }

      _driverMarkers = next;
      notifyListeners();
    };

    _socketService.onQueueUpdate = (payload) {
      _queueSnapshot = QueueSnapshot.fromJson(payload);
      notifyListeners();
      _loadMyQueuePosition();
    };

    _socketService.onDriverStatus = (payload) {
      if (driver == null) {
        return;
      }

      if (parseString(payload['driverId']) != driver!.id) {
        return;
      }

      _session = _session?.copyWith(
        driver: driver!.copyWith(
          status: parseString(payload['status'], driver!.status),
        ),
      );
      notifyListeners();
    };

    _socketService.onPaymentUpdate = (payload) {
      if (driver == null) {
        return;
      }

      if (parseString(payload['driverId']) != driver!.id) {
        return;
      }

      loadPaymentData();
    };
  }

  void _connectRealtime() {
    final accessToken = _session?.accessToken;
    if (!isAuthenticated || accessToken == null || accessToken.isEmpty) {
      return;
    }

    _socketService.connect(accessToken);
  }

  Future<void> _loadProfile() async {
    final profile = await _apiClient.getMe();
    if (_session == null) {
      return;
    }

    _session = _session!.copyWith(driver: profile);
  }

  Future<void> _loadRoutes() async {
    _routes = await _apiClient.getRoutes();
  }

  Future<void> _loadMyQueuePosition() async {
    _queuePosition = await _apiClient.getMyPosition();
    notifyListeners();
  }

  void _clearMessages() {
    _errorMessage = null;
    _infoMessage = null;
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }

  String _normalizePhone(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');

    if (digits.startsWith('998')) {
      return '+$digits';
    }

    if (digits.length == 9) {
      return '+998$digits';
    }

    return value.trim();
  }

  String _resolveError(Object error) {
    if (error is DioException) {
      final payload = ensureMap(error.response?.data);
      final message = payload['message'];

      if (message is List) {
        return message.join(', ');
      }

      if (message != null) {
        return message.toString();
      }

      return error.message ?? 'Tarmoq xatosi yuz berdi';
    }

    return error.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _restoreSession() async {
    try {
      final accessToken = await _sessionStorage.readAccessToken();
      if (accessToken == null || accessToken.isEmpty) {
        return;
      }

      _apiClient.setAccessToken(accessToken);
      final profile = await _apiClient.getMe();
      _session = AuthSession(
        accessToken: accessToken,
        driver: profile,
      );
      await refreshAll();
      _connectRealtime();
      await _ensureLocationTracking();
    } catch (_) {
      _session = null;
      _apiClient.setAccessToken(null);
      await _sessionStorage.clear();
    } finally {
      _initialized = true;
      notifyListeners();
    }
  }

  Future<void> _ensureLocationTracking() async {
    if (!isAuthenticated || !isOnline || _locationTimer != null) {
      return;
    }

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _errorMessage = 'GPS xizmati yoqilmagan.';
      notifyListeners();
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      _errorMessage = 'GPS ruxsati talab qilinadi.';
      notifyListeners();
      return;
    }

    await _captureAndSendLocation();
    _locationTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _captureAndSendLocation(),
    );
  }

  void _stopLocationTracking() {
    _locationTimer?.cancel();
    _locationTimer = null;
  }

  Future<void> _captureAndSendLocation() async {
    if (!isAuthenticated || !isOnline) {
      return;
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      await pushLocation(
        lat: position.latitude,
        lng: position.longitude,
      );
    } catch (error) {
      _errorMessage = _resolveError(error);
      notifyListeners();
    }
  }
}
