import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "/realtime",
  cors: {
    origin: "*",
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit("connected", {
      id: client.id,
      time: new Date().toISOString(),
    });
  }

  @SubscribeMessage("drivers:subscribe")
  subscribeDrivers(client: Socket) {
    client.join("drivers");
    return { event: "drivers:subscribed", data: { ok: true } };
  }

  @SubscribeMessage("queue:subscribe")
  subscribeQueue(
    client: Socket,
    @MessageBody() body: { pointId: string | number },
  ) {
    client.join(`queue:${body.pointId}`);
    return {
      event: "queue:subscribed",
      data: { pointId: String(body.pointId) },
    };
  }

  emitDriversUpdate(payload: unknown) {
    this.server.to("drivers").emit("drivers:update", payload);
  }

  emitQueueUpdate(pointId: string | number, payload: unknown) {
    this.server.to(`queue:${pointId}`).emit("queue:update", payload);
  }

  emitDriverStatus(payload: unknown) {
    this.server.emit("driver:status", payload);
  }

  emitPaymentUpdate(payload: unknown) {
    this.server.emit("payment:update", payload);
  }
}
