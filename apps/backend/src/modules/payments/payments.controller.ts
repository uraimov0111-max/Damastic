import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentDriver } from "../../common/decorators/current-driver.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PaymentCallbackDto } from "./dto/payment-callback.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get("driver-link")
  getDriverLink(@CurrentDriver() driver: { id: bigint }) {
    return this.paymentsService.getDriverLink(driver.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("history")
  getHistory(@CurrentDriver() driver: { id: bigint }) {
    return this.paymentsService.getHistory(driver.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("summary")
  getSummary(@CurrentDriver() driver: { id: bigint }) {
    return this.paymentsService.getSummary(driver.id);
  }

  @Post("click/callback")
  clickCallback(@Body() dto: PaymentCallbackDto) {
    return this.paymentsService.handleCallback("click", dto);
  }

  @Post("payme/callback")
  paymeCallback(@Body() dto: PaymentCallbackDto) {
    return this.paymentsService.handleCallback("payme", dto);
  }
}
