import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { JoinQueueDto } from "./dto/join-queue.dto";
import { LeaveQueueDto } from "./dto/leave-queue.dto";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

@Injectable()
export class QueuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async joinQueue(driverId: bigint, dto: JoinQueueDto) {
    const pointId = BigInt(dto.pointId);
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        location: true,
      },
    });

    if (!driver) {
      throw new NotFoundException("Haydovchi topilmadi");
    }

    if (driver.status !== "online") {
      throw new BadRequestException("Faqat online haydovchi navbat ola oladi");
    }

    if (!driver.vehicleId) {
      throw new BadRequestException("Navbat uchun haydovchiga ro'yxatdan o'tgan mashina biriktirilishi kerak");
    }

    const point = await this.prisma.routePoint.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw new NotFoundException("Punkt topilmadi");
    }

    if (!driver.routeId || driver.routeId !== point.routeId) {
      throw new BadRequestException("Haydovchi bu marshrut punktiga tegishli emas");
    }

    if (!driver.location) {
      throw new BadRequestException("Avval lokatsiya yuborilishi kerak");
    }

    const distance = calculateDistanceMeters(
      driver.location.lat.toNumber(),
      driver.location.lng.toNumber(),
      point.lat.toNumber(),
      point.lng.toNumber(),
    );

    if (distance > point.radius) {
      throw new BadRequestException(
        `Haydovchi punkt radiusidan tashqarida. Masofa: ${Math.round(distance)} metr`,
      );
    }

    const queue = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingQueue = await tx.queue.findFirst({
        where: {
          driverId,
          status: "active",
        },
      });

      if (existingQueue) {
        throw new BadRequestException("Haydovchi allaqachon aktiv navbatda turibdi");
      }

      const counter = await tx.queueCounter.upsert({
        where: {
          pointId,
        },
        create: {
          pointId,
          nextPosition: 2,
        },
        update: {
          nextPosition: {
            increment: 1,
          },
        },
      });

      const position = counter.nextPosition - 1;
      const createdQueue = await tx.queue.create({
        data: {
          driverId,
          pointId,
          position,
        },
      });

      await tx.queueEvent.create({
        data: {
          queueId: createdQueue.id,
          driverId,
          pointId,
          eventType: "joined",
          position,
        },
      });

      return createdQueue;
    });

    const snapshot = await this.getPointQueue(dto.pointId);
    this.realtimeGateway.emitQueueUpdate(dto.pointId, snapshot);

    return {
      queueId: queue.id.toString(),
      pointId: queue.pointId.toString(),
      position: queue.position,
      distanceMeters: Math.round(distance),
    };
  }

  async leaveQueue(driverId: bigint, dto: LeaveQueueDto) {
    const activeQueue = await this.prisma.queue.findFirst({
      where: {
        driverId,
        status: "active",
        ...(dto.pointId ? { pointId: BigInt(dto.pointId) } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!activeQueue) {
      throw new NotFoundException("Aktiv navbat topilmadi");
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.queue.update({
        where: { id: activeQueue.id },
        data: {
          status: "left",
          leftAt: new Date(),
        },
      });

      await tx.queueEvent.create({
        data: {
          queueId: activeQueue.id,
          driverId,
          pointId: activeQueue.pointId,
          eventType: "left",
          position: activeQueue.position,
        },
      });

      const tailQueues = await tx.queue.findMany({
        where: {
          pointId: activeQueue.pointId,
          status: "active",
          position: {
            gt: activeQueue.position,
          },
        },
        orderBy: {
          position: "asc",
        },
      });

      await Promise.all(
        tailQueues.map((queue) =>
          Promise.all([
            tx.queue.update({
              where: { id: queue.id },
              data: { position: queue.position - 1 },
            }),
            tx.queueEvent.create({
              data: {
                queueId: queue.id,
                driverId: queue.driverId,
                pointId: queue.pointId,
                eventType: "auto_shift",
                position: queue.position - 1,
              },
            }),
          ]),
        ),
      );
    });

    const snapshot = await this.getPointQueue(Number(activeQueue.pointId));
    this.realtimeGateway.emitQueueUpdate(activeQueue.pointId.toString(), snapshot);

    return {
      success: true,
      pointId: activeQueue.pointId.toString(),
    };
  }

  async getPointQueue(pointId: number) {
    const point = await this.prisma.routePoint.findUnique({
      where: { id: BigInt(pointId) },
      include: {
        route: true,
        queues: {
          where: {
            status: "active",
          },
          include: {
            driver: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!point) {
      throw new NotFoundException("Punkt topilmadi");
    }

    return {
      point: {
        id: point.id.toString(),
        routeId: point.routeId.toString(),
        routeName: point.route.name,
        name: point.name,
        lat: point.lat.toNumber(),
        lng: point.lng.toNumber(),
        radius: point.radius,
      },
      total: point.queues.length,
      entries: point.queues.map((queue: any) => ({
        queueId: queue.id.toString(),
        driverId: queue.driverId.toString(),
        driverName: queue.driver.name,
        carNumber: queue.driver.carNumber,
        position: queue.position,
        createdAt: queue.createdAt,
      })),
    };
  }

  async getMyPosition(driverId: bigint) {
    const queue = await this.prisma.queue.findFirst({
      where: {
        driverId,
        status: "active",
      },
      include: {
        point: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!queue) {
      return {
        active: false,
      };
    }

    return {
      active: true,
      queueId: queue.id.toString(),
      position: queue.position,
      point: {
        id: queue.point.id.toString(),
        name: queue.point.name,
      },
    };
  }
}
