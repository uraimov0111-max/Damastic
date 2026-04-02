import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoutes() {
    const routes = await this.prisma.route.findMany({
      include: {
        points: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return routes.map((route: any) => ({
      id: route.id.toString(),
      name: route.name,
      price: route.price.toNumber(),
      points: route.points.map((point: any) => ({
        id: point.id.toString(),
        name: point.name,
        lat: point.lat.toNumber(),
        lng: point.lng.toNumber(),
        radius: point.radius,
      })),
    }));
  }

  async getRouteById(routeId: bigint) {
    const route = await this.prisma.route.findUniqueOrThrow({
      where: { id: routeId },
      include: {
        points: true,
      },
    });

    return {
      id: route.id.toString(),
      name: route.name,
      price: route.price.toNumber(),
      points: route.points.map((point: any) => ({
        id: point.id.toString(),
        name: point.name,
        lat: point.lat.toNumber(),
        lng: point.lng.toNumber(),
        radius: point.radius,
      })),
    };
  }

  async getRoutePoints(routeId: bigint) {
    const points = await this.prisma.routePoint.findMany({
      where: { routeId },
      orderBy: { id: "asc" },
    });

    return points.map((point: any) => ({
      id: point.id.toString(),
      routeId: point.routeId.toString(),
      name: point.name,
      lat: point.lat.toNumber(),
      lng: point.lng.toNumber(),
      radius: point.radius,
    }));
  }
}
