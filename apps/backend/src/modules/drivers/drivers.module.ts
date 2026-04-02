import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DriversController } from "./drivers.controller";
import { DriversService } from "./drivers.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Module({
  imports: [JwtModule],
  controllers: [DriversController],
  providers: [DriversService, JwtAuthGuard],
  exports: [DriversService],
})
export class DriversModule {}
