import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { verifyPassword } from "../../common/security/password";
import { AdminLoginDto } from "./dto/admin-login.dto";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
      include: {
        alliance: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException("Admin topilmadi yoki faol emas");
    }

    if (!verifyPassword(dto.password, admin.passwordHash)) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: admin.id.toString(),
      typ: "admin",
      role: admin.role,
      allianceId: admin.allianceId?.toString() ?? null,
    });

    return {
      accessToken,
      admin: this.serializeAdmin(admin),
    };
  }

  async me(adminId: bigint) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      include: {
        alliance: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new NotFoundException("Admin topilmadi");
    }

    return this.serializeAdmin(admin);
  }

  private serializeAdmin(admin: {
    id: bigint;
    fullName: string;
    email: string;
    role: "super_admin" | "alliance_admin";
    allianceId: bigint | null;
    alliance?: {
      id: bigint;
      name: string;
      slug: string;
      status: string;
    } | null;
  }) {
    return {
      id: admin.id.toString(),
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      alliance: admin.alliance
        ? {
            id: admin.alliance.id.toString(),
            name: admin.alliance.name,
            slug: admin.alliance.slug,
            status: admin.alliance.status,
          }
        : null,
    };
  }
}
