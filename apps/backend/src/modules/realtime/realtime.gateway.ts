import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "/realtime",
  cors: {
    origin: "*",
  },
})
export class RealtimeGateway {
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      client.emit("socket:error", { message: "Realtime token talab qilinadi" });
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        typ: "driver" | "admin";
        role?: "super_admin" | "alliance_admin";
        allianceId?: string | null;
      }>(token);

      client.data.user = {
        id: payload.sub,
        typ: payload.typ,
        role: payload.role,
        allianceId: payload.allianceId ?? null,
      };
    } catch {
      client.emit("socket:error", { message: "Realtime token yaroqsiz" });
      client.disconnect();
      return;
    }

    client.emit("connected", {
      id: client.id,
      time: new Date().toISOString(),
    });
  }

  @SubscribeMessage("drivers:subscribe")
  subscribeDrivers(@ConnectedSocket() client: Socket) {
    if (!client.data.user) {
      client.disconnect();
      return;
    }

    client.join("drivers");
    return { event: "drivers:subscribed", data: { ok: true } };
  }

  @SubscribeMessage("queue:subscribe")
  subscribeQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { pointId: string | number },
  ) {
    if (!client.data.user) {
      client.disconnect();
      return;
    }

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
    this.server.to("drivers").emit("driver:status", payload);
  }

  emitPaymentUpdate(payload: unknown) {
    this.server.to("drivers").emit("payment:update", payload);
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === "string" && authToken.trim().length > 0) {
      return authToken.trim();
    }

    const headerValue = client.handshake.headers.authorization;
    if (typeof headerValue === "string" && headerValue.startsWith("Bearer ")) {
      return headerValue.slice(7).trim();
    }

    const queryToken = client.handshake.query.token;
    if (typeof queryToken === "string" && queryToken.trim().length > 0) {
      return queryToken.trim();
    }

    return null;
  }
}
