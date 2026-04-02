import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { SendCodeDto } from "./dto/send-code.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async sendCode(dto: SendCodeDto) {
    const phone = dto.phone.trim();
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
    });

    if (!driver) {
      throw new NotFoundException("Bu raqam bo'yicha haydovchi topilmadi");
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
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

    console.log(`[OTP] ${phone} => ${code}`);

    return {
      success: true,
      expiresAt,
      ...(process.env.NODE_ENV !== "production" ? { debugCode: code } : {}),
    };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const phone = dto.phone.trim();
    const code = dto.code.trim();

    const authCode = await this.prisma.authCode.findFirst({
      where: {
        phone,
        code,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
      throw new BadRequestException("SMS kod muddati tugagan");
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
}
