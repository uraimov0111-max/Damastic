import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminRoles } from "../../common/decorators/admin-roles.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import { AdminRolesGuard } from "../../common/guards/admin-roles.guard";
import { CreateAllianceDto } from "./dto/create-alliance.dto";
import { AdminConsoleService } from "./admin-console.service";

@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles("super_admin")
@Controller("admin/super")
export class SuperAdminController {
  constructor(private readonly adminConsoleService: AdminConsoleService) {}

  @Get("overview")
  overview() {
    return this.adminConsoleService.getSuperOverview();
  }

  @Get("alliances")
  alliances() {
    return this.adminConsoleService.listAlliances();
  }

  @Get("sms/status")
  smsStatus() {
    return this.adminConsoleService.getSmsProviderStatus();
  }

  @Post("alliances")
  createAlliance(@Body() dto: CreateAllianceDto) {
    return this.adminConsoleService.createAlliance(dto);
  }
}
