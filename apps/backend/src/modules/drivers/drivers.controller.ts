import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentDriver } from "../../common/decorators/current-driver.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { DriversService } from "./drivers.service";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

@UseGuards(JwtAuthGuard)
@Controller("drivers")
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get("me")
  getMe(@CurrentDriver() driver: { id: bigint }) {
    return this.driversService.getMe(driver.id);
  }

  @Patch("me")
  updateMe(
    @CurrentDriver() driver: { id: bigint },
    @Body() dto: UpdateDriverDto,
  ) {
    return this.driversService.updateMe(driver.id, dto);
  }

  @Patch("status")
  updateStatus(
    @CurrentDriver() driver: { id: bigint },
    @Body() dto: UpdateStatusDto,
  ) {
    return this.driversService.updateStatus(driver.id, dto.status);
  }
}
