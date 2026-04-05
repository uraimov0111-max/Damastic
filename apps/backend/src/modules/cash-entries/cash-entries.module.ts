import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { WalletsModule } from "../wallets/wallets.module";
import { CashEntriesController } from "./cash-entries.controller";
import { CashEntriesService } from "./cash-entries.service";

@Module({
  imports: [WalletsModule],
  controllers: [CashEntriesController],
  providers: [CashEntriesService, JwtAuthGuard],
  exports: [CashEntriesService],
})
export class CashEntriesModule {}
