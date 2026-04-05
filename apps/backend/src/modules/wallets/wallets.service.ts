import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type WalletClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  get client(): WalletClient {
    return this.prisma;
  }

  async creditDriver(
    client: WalletClient,
    options: {
      driverId: bigint;
      amount: number;
      entryType:
        | "electronic_in"
        | "cash_in"
        | "adjustment_in"
        | "adjustment_out"
        | "payout_out";
      note?: string;
      paymentId?: bigint;
      cashEntryId?: bigint;
    },
  ) {
    const wallet = await client.wallet.upsert({
      where: { driverId: options.driverId },
      create: {
        driverId: options.driverId,
        balance: 0,
      },
      update: {},
    });

    await client.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        driverId: options.driverId,
        paymentId: options.paymentId,
        cashEntryId: options.cashEntryId,
        entryType: options.entryType,
        amount: options.amount,
        note: options.note,
      },
    });

    return client.wallet.update({
      where: { driverId: options.driverId },
      data: {
        balance: {
          increment: new Prisma.Decimal(options.amount),
        },
      },
    });
  }
}
