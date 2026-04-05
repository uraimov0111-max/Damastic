import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletsService } from "../wallets/wallets.service";
import { CreateCashEntryDto } from "./dto/create-cash-entry.dto";

@Injectable()
export class CashEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
  ) {}

  async create(driverId: bigint, dto: CreateCashEntryDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        route: true,
      },
    });

    if (!driver) {
      throw new NotFoundException("Haydovchi topilmadi");
    }

    if (!driver.allianceId) {
      throw new BadRequestException("Haydovchi alyansga biriktirilmagan");
    }

    const fareAmount =
      driver.route?.price.toNumber() ??
      5000;
    const totalAmount = fareAmount * dto.passengerCount;

    const result = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.cashEntry.create({
        data: {
          allianceId: driver.allianceId!,
          driverId,
          vehicleId: driver.vehicleId,
          passengerCount: dto.passengerCount,
          fareAmount,
          totalAmount,
        },
      });

      const wallet = await this.walletsService.creditDriver(tx, {
        driverId,
        amount: totalAmount,
        entryType: "cash_in",
        note: `Naqd tushum: ${dto.passengerCount} yo'lovchi`,
        cashEntryId: entry.id,
      });

      return {
        entry,
        wallet,
      };
    });

    return {
      id: result.entry.id.toString(),
      passengerCount: result.entry.passengerCount,
      fareAmount: result.entry.fareAmount.toNumber(),
      totalAmount: result.entry.totalAmount.toNumber(),
      walletBalance: result.wallet.balance.toNumber(),
      createdAt: result.entry.createdAt,
    };
  }

  async getDriverSummary(driverId: bigint) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const [count, aggregate, wallet] = await Promise.all([
      this.prisma.cashEntry.count({
        where: {
          driverId,
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.cashEntry.aggregate({
        where: {
          driverId,
          createdAt: {
            gte: since,
          },
        },
        _sum: {
          passengerCount: true,
          totalAmount: true,
        },
      }),
      this.prisma.wallet.findUnique({
        where: { driverId },
      }),
    ]);

    return {
      entriesToday: count,
      passengersToday: aggregate._sum.passengerCount ?? 0,
      cashToday: aggregate._sum.totalAmount?.toNumber() ?? 0,
      walletBalance: wallet?.balance.toNumber() ?? 0,
    };
  }
}
