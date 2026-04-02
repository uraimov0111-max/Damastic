import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { QueuesController } from "./queues.controller";
import { QueuesService } from "./queues.service";

@Module({
  imports: [JwtModule],
  controllers: [QueuesController],
  providers: [QueuesService, JwtAuthGuard],
  exports: [QueuesService],
})
export class QueuesModule {}
