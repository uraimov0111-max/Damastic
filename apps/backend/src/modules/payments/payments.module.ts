import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [JwtModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, JwtAuthGuard],
})
export class PaymentsModule {}
