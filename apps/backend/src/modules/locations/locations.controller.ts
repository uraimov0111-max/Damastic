import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentDriver } from "../../common/decorators/current-driver.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { LocationsService } from "./locations.service";

@UseGuards(JwtAuthGuard)
@Controller("locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  updateLocation(
    @CurrentDriver() driver: { id: bigint },
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(driver.id, dto);
  }
}
