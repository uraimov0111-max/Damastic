import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { UpdateDriverDto } from "./dto/update-driver.dto";

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getMe(driverId: bigint) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        route: true,
        location: true,
      },
    });

    if (!driver) {
      throw new NotFoundException("Haydovchi topilmadi");
    }

    return {
      ...driver,
      id: driver.id.toString(),
      routeId: driver.routeId?.toString() ?? null,
      route: driver.route
        ? {
            id: driver.route.id.toString(),
            name: driver.route.name,
            price: driver.route.price.toNumber(),
          }
        : null,
      location: driver.location
        ? {
            lat: driver.location.lat.toNumber(),
            lng: driver.location.lng.toNumber(),
            updatedAt: driver.location.updatedAt,
          }
        : null,
    };
  }

  async updateMe(driverId: bigint, dto: UpdateDriverDto) {
    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.carNumber ? { carNumber: dto.carNumber.trim().toUpperCase() } : {}),
        ...(dto.cardNumber ? { cardNumber: dto.cardNumber.trim() } : {}),
      },
      include: {
        route: true,
      },
    });

    return {
      id: updated.id.toString(),
      name: updated.name,
      phone: updated.phone,
      status: updated.status,
      carNumber: updated.carNumber,
      cardNumber: updated.cardNumber,
      route: updated.route
        ? {
            id: updated.route.id.toString(),
            name: updated.route.name,
            price: updated.route.price.toNumber(),
          }
        : null,
    };
  }

  async updateStatus(driverId: bigint, status: "offline" | "online") {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: { status },
      include: {
        route: true,
        location: true,
      },
    });

    this.realtimeGateway.emitDriverStatus({
      driverId: driver.id.toString(),
      status: driver.status,
      routeId: driver.routeId?.toString() ?? null,
    });

    return {
      id: driver.id.toString(),
      status: driver.status,
    };
  }
}
