import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import '../utils/json_parsing.dart';

class SocketService {
  io.Socket? _socket;

  void Function()? onConnected;
  void Function()? onDisconnected;
  void Function(Map<String, dynamic>)? onDriversUpdate;
  void Function(Map<String, dynamic>)? onQueueUpdate;
  void Function(Map<String, dynamic>)? onDriverStatus;
  void Function(Map<String, dynamic>)? onPaymentUpdate;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    disconnect();

    _socket = io.io(
      AppConfig.socketBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableForceNew()
          .build(),
    );

    _socket!.onConnect((_) => onConnected?.call());
    _socket!.onDisconnect((_) => onDisconnected?.call());
    _socket!.on('drivers:update', (payload) {
      onDriversUpdate?.call(ensureMap(payload));
    });
    _socket!.on('queue:update', (payload) {
      onQueueUpdate?.call(ensureMap(payload));
    });
    _socket!.on('driver:status', (payload) {
      onDriverStatus?.call(ensureMap(payload));
    });
    _socket!.on('payment:update', (payload) {
      onPaymentUpdate?.call(ensureMap(payload));
    });

    _socket!.connect();
  }

  void subscribeDrivers() {
    _socket?.emit('drivers:subscribe');
  }

  void subscribeQueue(String pointId) {
    _socket?.emit('queue:subscribe', {'pointId': pointId});
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
