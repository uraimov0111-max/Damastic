import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { SendCodeDto } from "./dto/send-code.dto";
import { SmsService } from "./sms.service";
import { VerifyCodeDto } from "./dto/verify-code.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  async sendCode(dto: SendCodeDto) {
    const phone = dto.phone.trim();
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
    });

    if (!driver) {
      throw new NotFoundException("Bu raqam bo'yicha haydovchi topilmadi");
    }

    const [recentCodesCount, latestUnusedCode] = await Promise.all([
      this.prisma.authCode.count({
        where: {
          phone,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.authCode.findFirst({
        where: {
          phone,
          usedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const resendIntervalSeconds = this.config.get<number>(
      "OTP_RESEND_INTERVAL_SECONDS",
      60,
    );
    const maxSendPerHour = this.config.get<number>("OTP_MAX_SEND_PER_HOUR", 5);

    if (recentCodesCount >= maxSendPerHour) {
      throw new BadRequestException(
        "SMS kod yuborish limiti tugadi. Keyinroq urinib ko'ring",
      );
    }

    if (latestUnusedCode) {
      const secondsSinceLastCode = Math.floor(
        (Date.now() - latestUnusedCode.createdAt.getTime()) / 1000,
      );

      if (secondsSinceLastCode < resendIntervalSeconds) {
        throw new BadRequestException(
          `SMS kodni qayta yuborish uchun ${
            resendIntervalSeconds - secondsSinceLastCode
          } soniya kuting`,
        );
      }
    }

    const otpLength = this.config.get<number>("OTP_LENGTH", 6);
    const code = this.generateCode(otpLength);
    const expiresMinutes = this.config.get<number>("OTP_EXPIRES_MINUTES", 5);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.prisma.authCode.updateMany({
      where: {
        phone,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await this.prisma.authCode.create({
      data: {
        phone,
        driverId: driver.id,
        code,
        expiresAt,
      },
    });

    try {
      await this.smsService.sendOneTimePassword(phone, code, expiresMinutes);
    } catch (error) {
      await this.prisma.authCode.updateMany({
        where: {
          phone,
          code,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (error instanceof Error) {
        throw new ServiceUnavailableException(error.message);
      }

      throw new ServiceUnavailableException("SMS kod yuborib bo'lmadi");
    }

    return {
      success: true,
      expiresAt,
      ...(this.config.get<boolean>("AUTH_EXPOSE_DEBUG_CODE", false)
        ? { debugCode: code }
        : {}),
    };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const phone = dto.phone.trim();
    const code = dto.code.trim();
    const maxVerifyAttempts = this.config.get<number>(
      "OTP_MAX_VERIFY_ATTEMPTS",
      5,
    );

    const authCode = await this.prisma.authCode.findFirst({
      where: {
        phone,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        code: true,
        attempts: true,
        expiresAt: true,
        driver: {
          include: {
            route: true,
          },
        },
      },
    });

    if (!authCode) {
      throw new BadRequestException("SMS kod noto'g'ri");
    }

    if (authCode.expiresAt.getTime() < Date.now()) {
      await this.prisma.authCode.update({
        where: { id: authCode.id },
        data: { usedAt: new Date() },
      });
      throw new BadRequestException("SMS kod muddati tugagan");
    }

    if (authCode.attempts >= maxVerifyAttempts) {
      await this.prisma.authCode.update({
        where: { id: authCode.id },
        data: { usedAt: new Date() },
      });
      throw new BadRequestException("SMS kod bo'yicha urinishlar soni tugadi");
    }

    if (authCode.code !== code) {
      await this.prisma.authCode.update({
        where: { id: authCode.id },
        data: {
          attempts: authCode.attempts + 1,
        },
      });

      throw new BadRequestException("SMS kod noto'g'ri");
    }

    if (!authCode.driver) {
      throw new NotFoundException("Haydovchi topilmadi");
    }

    await this.prisma.authCode.update({
      where: { id: authCode.id },
      data: { usedAt: new Date() },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: authCode.driver.id.toString(),
      phone: authCode.driver.phone,
      typ: "driver",
    });

    return {
      accessToken,
      driver: {
        id: authCode.driver.id.toString(),
        name: authCode.driver.name,
        phone: authCode.driver.phone,
        status: authCode.driver.status,
        carNumber: authCode.driver.carNumber,
        route: authCode.driver.route
          ? {
              id: authCode.driver.route.id.toString(),
              name: authCode.driver.route.name,
              price: authCode.driver.route.price.toNumber(),
            }
          : null,
      },
    };
  }

  private generateCode(length: number) {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return Math.floor(min + Math.random() * (max - min)).toString();
  }
}
