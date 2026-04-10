import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { AuthenticatedAdmin } from "../../common/decorators/current-admin.decorator";
import { hashPassword } from "../../common/security/password";
import { SmsService } from "../auth/sms.service";
import { CreateAllianceDto } from "./dto/create-alliance.dto";
import { CreateAllianceDriverDto } from "./dto/create-alliance-driver.dto";
import { CreateAllianceRouteDto } from "./dto/create-alliance-route.dto";
import { CreateAllianceVehicleDto } from "./dto/create-alliance-vehicle.dto";

@Injectable()
export class AdminConsoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  async getSuperOverview() {
    const since = this.startOfToday();

    const [alliances, drivers, onlineDrivers, vehicles, routes, payments, cash, wallets] =
      await Promise.all([
        this.prisma.alliance.count(),
        this.prisma.driver.count(),
        this.prisma.driver.count({ where: { status: "online" } }),
        this.prisma.vehicle.count(),
        this.prisma.route.count(),
        this.prisma.payment.aggregate({
          where: {
            status: "success",
            createdAt: { gte: since },
          },
          _sum: { amount: true },
        }),
        this.prisma.cashEntry.aggregate({
          where: {
            createdAt: { gte: since },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.wallet.aggregate({
          _sum: { balance: true },
        }),
      ]);

    return {
      alliances,
      drivers,
      onlineDrivers,
      vehicles,
      routes,
      electronicToday: payments._sum.amount?.toNumber() ?? 0,
      cashToday: cash._sum.totalAmount?.toNumber() ?? 0,
      walletTotal: wallets._sum.balance?.toNumber() ?? 0,
    };
  }

  async listAlliances() {
    const alliances = await this.prisma.alliance.findMany({
      include: {
        _count: {
          select: {
            admins: true,
            drivers: true,
            vehicles: true,
            routes: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return alliances.map((alliance) => ({
      id: alliance.id.toString(),
      name: alliance.name,
      slug: alliance.slug,
      status: alliance.status,
      drivers: alliance._count.drivers,
      vehicles: alliance._count.vehicles,
      routes: alliance._count.routes,
      admins: alliance._count.admins,
    }));
  }

  async createAlliance(dto: CreateAllianceDto) {
    const slug = dto.slug.trim().toLowerCase();
    const alliance = await this.prisma.$transaction(async (tx) => {
      const createdAlliance = await tx.alliance.create({
        data: {
          name: dto.name.trim(),
          slug,
        },
      });

      if (dto.adminEmail && dto.adminPassword && dto.adminFullName) {
        await tx.adminUser.create({
          data: {
            allianceId: createdAlliance.id,
            fullName: dto.adminFullName.trim(),
            email: dto.adminEmail.trim().toLowerCase(),
            passwordHash: hashPassword(dto.adminPassword),
            role: "alliance_admin",
          },
        });
      }

      return createdAlliance;
    });

    return {
      id: alliance.id.toString(),
      name: alliance.name,
      slug: alliance.slug,
      status: alliance.status,
    };
  }

  async getSmsProviderStatus() {
    return this.smsService.getProviderStatus();
  }

  async getAllianceDashboard(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const since = this.startOfToday();

    const [
      drivers,
      onlineDrivers,
      vehicles,
      activeVehicles,
      routes,
      activeQueues,
      payments,
      cash,
      wallet,
    ] = await Promise.all([
      this.prisma.driver.count({ where: { allianceId } }),
      this.prisma.driver.count({ where: { allianceId, status: "online" } }),
      this.prisma.vehicle.count({ where: { allianceId } }),
      this.prisma.vehicle.count({ where: { allianceId, status: "active" } }),
      this.prisma.route.count({ where: { allianceId } }),
      this.prisma.queue.count({
        where: {
          status: "active",
          point: {
            route: {
              allianceId,
            },
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "success",
          createdAt: { gte: since },
          driver: {
            allianceId,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.cashEntry.aggregate({
        where: {
          allianceId,
          createdAt: { gte: since },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.wallet.aggregate({
        where: {
          driver: {
            allianceId,
          },
        },
        _sum: { balance: true },
      }),
    ]);

    return {
      drivers,
      onlineDrivers,
      vehicles,
      activeVehicles,
      routes,
      activeQueues,
      electronicToday: payments._sum.amount?.toNumber() ?? 0,
      cashToday: cash._sum.totalAmount?.toNumber() ?? 0,
      walletTotal: wallet._sum.balance?.toNumber() ?? 0,
    };
  }

  async listAllianceDrivers(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const drivers = await this.prisma.driver.findMany({
      where: { allianceId },
      include: {
        route: true,
        vehicle: true,
        wallet: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return drivers.map((driver) => ({
      id: driver.id.toString(),
      name: driver.name,
      phone: driver.phone,
      status: driver.status,
      carNumber: driver.vehicle?.plateNumber ?? driver.carNumber,
      route: driver.route
        ? {
            id: driver.route.id.toString(),
            name: driver.route.name,
            price: driver.route.price.toNumber(),
          }
        : null,
      vehicle: driver.vehicle
        ? {
            id: driver.vehicle.id.toString(),
            plateNumber: driver.vehicle.plateNumber,
            status: driver.vehicle.status,
          }
        : null,
      walletBalance: driver.wallet?.balance.toNumber() ?? 0,
    }));
  }

  async createAllianceDriver(admin: AuthenticatedAdmin, dto: CreateAllianceDriverDto) {
    const allianceId = this.requireAllianceId(admin);
    const routeId = BigInt(dto.routeId);
    const vehicleId = BigInt(dto.vehicleId);

    const [route, vehicle] = await Promise.all([
      this.prisma.route.findFirst({
        where: { id: routeId, allianceId },
      }),
      this.prisma.vehicle.findFirst({
        where: { id: vehicleId, allianceId },
      }),
    ]);

    if (!route) {
      throw new NotFoundException("Alyansga tegishli marshrut topilmadi");
    }

    if (!vehicle) {
      throw new NotFoundException("Alyansga tegishli mashina topilmadi");
    }

    const busyVehicleDriver = await this.prisma.driver.findFirst({
      where: {
        vehicleId,
      },
      select: { id: true },
    });

    if (busyVehicleDriver) {
      throw new BadRequestException("Bu mashina boshqa haydovchiga biriktirilgan");
    }

    const paymentSlug = this.buildPaymentSlug(vehicle.plateNumber);
    const driver = await this.prisma.$transaction(async (tx) => {
      const createdDriver = await tx.driver.create({
        data: {
          allianceId,
          vehicleId,
          routeId,
          name: dto.name.trim(),
          phone: this.normalizePhone(dto.phone),
          carNumber: vehicle.plateNumber,
          cardNumber: dto.cardNumber?.trim() || null,
          paymentSlug,
          status: "offline",
        },
      });

      await tx.wallet.create({
        data: {
          driverId: createdDriver.id,
          balance: 0,
        },
      });

      return createdDriver;
    });

    return {
      id: driver.id.toString(),
      name: driver.name,
      phone: driver.phone,
      carNumber: driver.carNumber,
      routeId: driver.routeId?.toString() ?? null,
      vehicleId: driver.vehicleId?.toString() ?? null,
    };
  }

  async deleteAllianceDriver(admin: AuthenticatedAdmin, driverId: string) {
    const allianceId = this.requireAllianceId(admin);

    const driver = await this.prisma.driver.findFirst({
      where: { id: BigInt(driverId), allianceId },
    });

    if (!driver) {
      throw new NotFoundException("Haydovchi topilmadi");
    }

    await this.prisma.driver.delete({
      where: { id: BigInt(driverId) },
    });

    return { success: true };
  }

  async listAllianceVehicles(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { allianceId },
      include: {
        route: true,
        driver: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return vehicles.map((vehicle) => ({
      id: vehicle.id.toString(),
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      seatCount: vehicle.seatCount,
      status: vehicle.status,
      qrToken: vehicle.qrToken,
      route: vehicle.route
        ? {
            id: vehicle.route.id.toString(),
            name: vehicle.route.name,
          }
        : null,
      driver: vehicle.driver
        ? {
            id: vehicle.driver.id.toString(),
            name: vehicle.driver.name,
          }
        : null,
    }));
  }

  async createAllianceVehicle(admin: AuthenticatedAdmin, dto: CreateAllianceVehicleDto) {
    const allianceId = this.requireAllianceId(admin);
    let routeId: bigint | null = null;

    if (dto.routeId) {
      routeId = BigInt(dto.routeId);
      const route = await this.prisma.route.findFirst({
        where: { id: routeId, allianceId },
      });

      if (!route) {
        throw new NotFoundException("Mashina uchun marshrut topilmadi");
      }
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        allianceId,
        routeId,
        plateNumber: dto.plateNumber.trim().toUpperCase(),
        model: dto.model?.trim() || null,
        seatCount: dto.seatCount ?? 11,
        qrToken: this.generateQrToken(),
      },
    });

    return {
      id: vehicle.id.toString(),
      plateNumber: vehicle.plateNumber,
      status: vehicle.status,
      qrToken: vehicle.qrToken,
    };
  }

  async listAllianceRoutes(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const routes = await this.prisma.route.findMany({
      where: { allianceId },
      include: {
        points: true,
        _count: {
          select: {
            drivers: true,
            vehicles: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return routes.map((route) => ({
      id: route.id.toString(),
      name: route.name,
      price: route.price.toNumber(),
      drivers: route._count.drivers,
      vehicles: route._count.vehicles,
      points: route.points.map((point) => ({
        id: point.id.toString(),
        name: point.name,
        lat: point.lat.toNumber(),
        lng: point.lng.toNumber(),
        radius: point.radius,
      })),
    }));
  }

  async createAllianceRoute(admin: AuthenticatedAdmin, dto: CreateAllianceRouteDto) {
    const allianceId = this.requireAllianceId(admin);
    const route = await this.prisma.route.create({
      data: {
        allianceId,
        name: dto.name.trim(),
        price: dto.price,
        points: {
          create: dto.points.map((point) => ({
            name: point.name.trim(),
            lat: point.lat,
            lng: point.lng,
            radius: point.radius,
          })),
        },
      },
      include: {
        points: true,
      },
    });

    return {
      id: route.id.toString(),
      name: route.name,
      price: route.price.toNumber(),
      points: route.points.map((point) => ({
        id: point.id.toString(),
        name: point.name,
      })),
    };
  }

  async getAllianceLiveQueues(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const points = await this.prisma.routePoint.findMany({
      where: {
        route: {
          allianceId,
        },
      },
      include: {
        route: true,
        queues: {
          where: {
            status: "active",
          },
          orderBy: {
            position: "asc",
          },
          include: {
            driver: {
              include: {
                vehicle: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return points.map((point) => ({
      pointId: point.id.toString(),
      pointName: point.name,
      routeId: point.routeId.toString(),
      routeName: point.route.name,
      total: point.queues.length,
      entries: point.queues.map((queue) => ({
        queueId: queue.id.toString(),
        position: queue.position,
        driverId: queue.driverId.toString(),
        driverName: queue.driver.name,
        vehiclePlate: queue.driver.vehicle?.plateNumber ?? queue.driver.carNumber,
      })),
    }));
  }

  async getAlliancePayments(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const payments = await this.prisma.payment.findMany({
      where: {
        driver: {
          allianceId,
        },
      },
      include: {
        driver: true,
        vehicle: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return payments.map((payment) => ({
      id: payment.id.toString(),
      amount: payment.amount.toNumber(),
      status: payment.status,
      paymentSystem: payment.paymentSystem,
      driverName: payment.driver.name,
      vehiclePlate: payment.vehicle?.plateNumber ?? payment.driver.carNumber,
      createdAt: payment.createdAt,
      walletPostedAt: payment.walletPostedAt,
    }));
  }

  async getAllianceCashEntries(admin: AuthenticatedAdmin) {
    const allianceId = this.requireAllianceId(admin);
    const entries = await this.prisma.cashEntry.findMany({
      where: {
        allianceId,
      },
      include: {
        driver: true,
        vehicle: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return entries.map((entry) => ({
      id: entry.id.toString(),
      passengerCount: entry.passengerCount,
      fareAmount: entry.fareAmount.toNumber(),
      totalAmount: entry.totalAmount.toNumber(),
      driverName: entry.driver.name,
      vehiclePlate: entry.vehicle?.plateNumber ?? entry.driver.carNumber,
      createdAt: entry.createdAt,
    }));
  }

  private requireAllianceId(admin: AuthenticatedAdmin) {
    if (!admin.allianceId) {
      throw new BadRequestException("Admin alyansga biriktirilmagan");
    }

    return admin.allianceId;
  }

  private startOfToday() {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    return since;
  }

  private generateQrToken() {
    return randomBytes(12).toString("hex");
  }

  private buildPaymentSlug(plateNumber: string) {
    const normalized = plateNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `${normalized}-${Date.now()}`;
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("998")) {
      return "+" + digits;
    }
    if (digits.length === 9) {
      return "+998" + digits;
    }
    return "+" + digits; // Fallback for other countries if any
  }
}
