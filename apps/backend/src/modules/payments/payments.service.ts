import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { WalletsService } from "../wallets/wallets.service";
import { PaymentCallbackDto } from "./dto/payment-callback.dto";
import { PaymentSignatureService } from "./payment-signature.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly walletsService: WalletsService,
    private readonly paymentSignatureService: PaymentSignatureService,
  ) {}

  private get paymentCallbackLogs() {
    return this.prisma as PrismaService & {
      paymentCallbackLog: {
        create(args: { data: Record<string, unknown> }): Promise<unknown>;
      };
    };
  }

  async getDriverLink(driverId: bigint) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { route: true, wallet: true, vehicle: true },
    });

    if (!driver) {
      throw new NotFoundException("Haydovchi topilmadi");
    }

    const baseUrl = this.config.get<string>(
      "PAYMENT_BASE_URL",
      "https://pay.damastic.uz",
    );
    const defaultPrice = this.config.get<number>("DEFAULT_ROUTE_PRICE", 5000);
    const amount = driver.route?.price.toNumber() ?? defaultPrice;
    const payLink = `${baseUrl}/driver/${driver.paymentSlug}`;

    return {
      driverId: driver.id.toString(),
      amount,
      payLink,
      qrPayload: payLink,
      systems: ["click", "payme"],
      walletBalance: driver.wallet?.balance.toNumber() ?? 0,
      vehicleId: driver.vehicleId?.toString() ?? null,
    };
  }

  async getHistory(driverId: bigint) {
    const payments = await this.prisma.payment.findMany({
      where: { driverId },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return payments.map((payment: any) => ({
      id: payment.id.toString(),
      amount: payment.amount.toNumber(),
      status: payment.status,
      paymentSystem: payment.paymentSystem,
      externalTransactionId: payment.externalTransactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));
  }

  async handleCallback(
    system: "click" | "payme",
    dto: PaymentCallbackDto,
    headerSignature?: string,
  ) {
    const callbackPayload = {
      ...dto,
      signature: headerSignature ?? dto.signature ?? null,
    };

    let verified = false;

    try {
      verified = this.paymentSignatureService.validateCallback(
        system,
        dto,
        headerSignature ?? dto.signature,
      );

      const payment = await this.prisma.$transaction(async (tx) => {
        const driver = await tx.driver.findUnique({
          where: { id: BigInt(dto.driverId) },
          select: { vehicleId: true },
        });

        const storedPayment = await tx.payment.upsert({
          where: {
            externalTransactionId: dto.transactionId,
          },
          update: {
            amount: dto.amount,
            status: dto.status,
            paymentSystem: system,
            vehicleId: driver?.vehicleId ?? null,
          },
          create: {
            driverId: BigInt(dto.driverId),
            vehicleId: driver?.vehicleId ?? null,
            amount: dto.amount,
            status: dto.status,
            paymentSystem: system,
            externalTransactionId: dto.transactionId,
          },
        });

        if (storedPayment.status === "success" && !storedPayment.walletPostedAt) {
          await this.walletsService.creditDriver(tx, {
            driverId: storedPayment.driverId,
            amount: storedPayment.amount.toNumber(),
            entryType: "electronic_in",
            note: `${system} orqali elektron to'lov`,
            paymentId: storedPayment.id,
          });

          return tx.payment.update({
            where: { id: storedPayment.id },
            data: {
              walletPostedAt: new Date(),
            },
          });
        }

        return storedPayment;
      });

      await this.paymentCallbackLogs.paymentCallbackLog.create({
        data: {
          provider: system,
          transactionId: dto.transactionId,
          driverId: BigInt(dto.driverId),
          status: dto.status,
          verified,
          payload: callbackPayload,
        },
      });

      this.realtimeGateway.emitPaymentUpdate({
        paymentId: payment.id.toString(),
        driverId: payment.driverId.toString(),
        status: payment.status,
        paymentSystem: payment.paymentSystem,
        amount: payment.amount.toNumber(),
      });

      return {
        success: true,
        paymentId: payment.id.toString(),
        status: payment.status,
        verified,
      };
    } catch (error) {
      await this.paymentCallbackLogs.paymentCallbackLog.create({
        data: {
          provider: system,
          transactionId: dto.transactionId,
          driverId: BigInt(dto.driverId),
          status: dto.status,
          verified,
          errorMessage: this.resolveErrorMessage(error),
          payload: callbackPayload,
        },
      });

      throw error;
    }
  }

  async getSummary(driverId: bigint) {
    const [success, pending, failed] = await Promise.all([
      this.prisma.payment.count({
        where: { driverId, status: "success" },
      }),
      this.prisma.payment.count({
        where: { driverId, status: "pending" },
      }),
      this.prisma.payment.count({
        where: { driverId, status: "failed" },
      }),
    ]);

    const totalPaid = await this.prisma.payment.aggregate({
      where: { driverId, status: "success" },
      _sum: { amount: true },
    });

    return {
      success,
      pending,
      failed,
      totalPaid: totalPaid._sum.amount?.toNumber() ?? 0,
    };
  }

  private resolveErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
