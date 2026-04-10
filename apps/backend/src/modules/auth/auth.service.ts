import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as admin from "firebase-admin";
import { PrismaService } from "../../database/prisma.service";
import { SendCodeDto } from "./dto/send-code.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "damastic-8bb8b",
  });
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async sendCode(_dto: SendCodeDto) {
    // Mijoz Firebase orqali o'zi SMS yuboradi. Eskiz'dagi eski mantiqni o'chiramiz.
    // Client SDK takes care of this step.
    return {
      success: true,
      message: "Frontend Firebase orqali tasdiqlaydi.",
    };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const isDev = this.config.get<string>("NODE_ENV") === "development";
    let phoneNumber: string | undefined;

    if (!isDev || dto.idToken) {
      if (!dto.idToken) {
        throw new BadRequestException("Firebase idToken null/xato");
      }
      try {
        const decoded = await admin.auth().verifyIdToken(dto.idToken);
        phoneNumber = decoded.phone_number;
      } catch (e) {
        throw new UnauthorizedException("Noto'g'ri yoki vaqti o'tgan token");
      }
    } else {
      if (dto.code !== "1234") {
        throw new BadRequestException("SMS kodi noto'g'ri");
      }
      phoneNumber = dto.phone?.trim();
    }

    if (!phoneNumber) {
      throw new BadRequestException("Telefon raqam aniqlanmadi");
    }

    const driver = await this.prisma.driver.findFirst({
      where: {
        phone: phoneNumber,
      },
      include: {
        route: true,
      },
    });

    if (!driver) {
      throw new NotFoundException("Ushbu raqam bo'yicha haydovchi topilmadi");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: driver.id.toString(),
      phone: driver.phone,
      typ: "driver",
    });

    return {
      accessToken,
      driver: {
        id: driver.id.toString(),
        name: driver.name,
        phone: driver.phone,
        status: driver.status,
        carNumber: driver.carNumber,
        route: driver.route
          ? {
              id: driver.route.id.toString(),
              name: driver.route.name,
              price: driver.route.price.toNumber(),
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
