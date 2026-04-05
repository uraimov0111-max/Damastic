import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentAdmin } from "../../common/decorators/current-admin.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminAuthService } from "./admin-auth.service";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post("login")
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Get("me")
  me(@CurrentAdmin() admin: { id: bigint }) {
    return this.adminAuthService.me(admin.id);
  }
}
