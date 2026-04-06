import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminRoles } from "../../common/decorators/admin-roles.decorator";
import { CurrentAdmin } from "../../common/decorators/current-admin.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import { AdminRolesGuard } from "../../common/guards/admin-roles.guard";
import { AdminConsoleService } from "./admin-console.service";
import { CreateAllianceDriverDto } from "./dto/create-alliance-driver.dto";
import { CreateAllianceRouteDto } from "./dto/create-alliance-route.dto";
import { CreateAllianceVehicleDto } from "./dto/create-alliance-vehicle.dto";

@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles("alliance_admin")
@Controller("admin/alliance")
export class AllianceAdminController {
  constructor(private readonly adminConsoleService: AdminConsoleService) {}

  @Get("dashboard")
  dashboard(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.getAllianceDashboard(admin);
  }

  @Get("drivers")
  drivers(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.listAllianceDrivers(admin);
  }

  @Post("drivers")
  createDriver(@CurrentAdmin() admin: any, @Body() dto: CreateAllianceDriverDto) {
    return this.adminConsoleService.createAllianceDriver(admin, dto);
  }

  @Get("vehicles")
  vehicles(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.listAllianceVehicles(admin);
  }

  @Post("vehicles")
  createVehicle(@CurrentAdmin() admin: any, @Body() dto: CreateAllianceVehicleDto) {
    return this.adminConsoleService.createAllianceVehicle(admin, dto);
  }

  @Get("routes")
  routes(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.listAllianceRoutes(admin);
  }

  @Post("routes")
  createRoute(@CurrentAdmin() admin: any, @Body() dto: CreateAllianceRouteDto) {
    return this.adminConsoleService.createAllianceRoute(admin, dto);
  }

  @Get("queues/live")
  queues(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.getAllianceLiveQueues(admin);
  }

  @Get("payments")
  payments(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.getAlliancePayments(admin);
  }

  @Get("sms/status")
  smsStatus() {
    return this.adminConsoleService.getSmsProviderStatus();
  }

  @Get("cash-entries")
  cashEntries(@CurrentAdmin() admin: any) {
    return this.adminConsoleService.getAllianceCashEntries(admin);
  }
}
