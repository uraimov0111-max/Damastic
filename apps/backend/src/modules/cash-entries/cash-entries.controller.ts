import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentDriver } from "../../common/decorators/current-driver.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateCashEntryDto } from "./dto/create-cash-entry.dto";
import { CashEntriesService } from "./cash-entries.service";

@UseGuards(JwtAuthGuard)
@Controller("cash-entries")
export class CashEntriesController {
  constructor(private readonly cashEntriesService: CashEntriesService) {}

  @Post()
  create(
    @CurrentDriver() driver: { id: bigint },
    @Body() dto: CreateCashEntryDto,
  ) {
    return this.cashEntriesService.create(driver.id, dto);
  }

  @Get("summary")
  summary(@CurrentDriver() driver: { id: bigint }) {
    return this.cashEntriesService.getDriverSummary(driver.id);
  }
}
