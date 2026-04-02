import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { PaymentCallbackDto } from "./dto/payment-callback.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getDriverLink(driverId: bigint) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { route: true },
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

  async handleCallback(system: "click" | "payme", dto: PaymentCallbackDto) {
    const payment = await this.prisma.payment.upsert({
      where: {
        externalTransactionId: dto.transactionId,
      },
      update: {
        amount: dto.amount,
        status: dto.status,
        paymentSystem: system,
      },
      create: {
        driverId: BigInt(dto.driverId),
        amount: dto.amount,
        status: dto.status,
        paymentSystem: system,
        externalTransactionId: dto.transactionId,
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
    };
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
}
