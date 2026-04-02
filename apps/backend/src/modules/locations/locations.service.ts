import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async updateLocation(driverId: bigint, dto: UpdateLocationDto) {
    const location = await this.prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        lat: dto.lat,
        lng: dto.lng,
      },
      create: {
        driverId,
        lat: dto.lat,
        lng: dto.lng,
      },
    });

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { route: true },
    });

    if (driver) {
      this.realtimeGateway.emitDriversUpdate({
        driverId: driver.id.toString(),
        name: driver.name,
        lat: location.lat.toNumber(),
        lng: location.lng.toNumber(),
        status: driver.status,
        routeId: driver.routeId?.toString() ?? null,
      });
    }

    return {
      driverId: driverId.toString(),
      lat: location.lat.toNumber(),
      lng: location.lng.toNumber(),
      updatedAt: location.updatedAt,
    };
  }
}
