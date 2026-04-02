import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { LocationsController } from "./locations.controller";
import { LocationsService } from "./locations.service";

@Module({
  imports: [JwtModule],
  controllers: [LocationsController],
  providers: [LocationsService, JwtAuthGuard],
  exports: [LocationsService],
})
export class LocationsModule {}
