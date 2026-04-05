import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { WalletsModule } from "../wallets/wallets.module";
import { PaymentsController } from "./payments.controller";
import { PaymentSignatureService } from "./payment-signature.service";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [JwtModule, WalletsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentSignatureService, JwtAuthGuard],
})
export class PaymentsModule {}
