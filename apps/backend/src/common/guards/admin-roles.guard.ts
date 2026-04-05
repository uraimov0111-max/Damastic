import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ADMIN_ROLES_KEY } from "../decorators/admin-roles.decorator";

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<
      Array<"super_admin" | "alliance_admin">
    >(ADMIN_ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const admin = request.admin as { role?: string } | undefined;

    if (!admin?.role || !requiredRoles.includes(admin.role as any)) {
      throw new ForbiddenException("Bu amal uchun admin huquqi yetarli emas");
    }

    return true;
  }
}
