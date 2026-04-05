import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
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
        typ?: string;
      }>(token);

      if (payload.typ !== "driver") {
        throw new UnauthorizedException("Driver token talab qilinadi");
      }

      const driver = await this.prisma.driver.findUnique({
        where: { id: BigInt(payload.sub) },
        select: { id: true, phone: true },
      });

      if (!driver) {
        throw new UnauthorizedException("Driver topilmadi");
      }

      request.user = driver;
      return true;
    } catch {
      throw new UnauthorizedException("Token yaroqsiz");
    }
  }
}
