import { Module } from "@nestjs/common";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import { AdminRolesGuard } from "../../common/guards/admin-roles.guard";
import { AuthModule } from "../auth/auth.module";
import { AdminConsoleService } from "./admin-console.service";
import { AllianceAdminController } from "./alliance-admin.controller";
import { SuperAdminController } from "./super-admin.controller";

@Module({
  imports: [AuthModule],
  controllers: [SuperAdminController, AllianceAdminController],
  providers: [AdminConsoleService, AdminAuthGuard, AdminRolesGuard],
})
export class AdminConsoleModule {}
