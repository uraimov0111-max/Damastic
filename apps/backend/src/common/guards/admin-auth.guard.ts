import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token talab qilinadi");
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        typ: string;
        role: "super_admin" | "alliance_admin";
        allianceId?: string | null;
      }>(token);

      if (payload.typ !== "admin") {
        throw new UnauthorizedException("Admin token talab qilinadi");
      }

      const admin = await this.prisma.adminUser.findUnique({
        where: { id: BigInt(payload.sub) },
        select: {
          id: true,
          email: true,
          role: true,
          allianceId: true,
          isActive: true,
        },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException("Admin topilmadi yoki bloklangan");
      }

      request.admin = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        allianceId: admin.allianceId,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Admin token yaroqsiz");
    }
  }
}
