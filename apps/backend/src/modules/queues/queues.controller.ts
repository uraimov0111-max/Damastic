import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentDriver } from "../../common/decorators/current-driver.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JoinQueueDto } from "./dto/join-queue.dto";
import { LeaveQueueDto } from "./dto/leave-queue.dto";
import { QueuesService } from "./queues.service";

@UseGuards(JwtAuthGuard)
@Controller("queues")
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post("join")
  joinQueue(
    @CurrentDriver() driver: { id: bigint },
    @Body() dto: JoinQueueDto,
  ) {
    return this.queuesService.joinQueue(driver.id, dto);
  }

  @Post("leave")
  leaveQueue(
    @CurrentDriver() driver: { id: bigint },
    @Body() dto: LeaveQueueDto,
  ) {
    return this.queuesService.leaveQueue(driver.id, dto);
  }

  @Get("point/:pointId")
  getPointQueue(@Param("pointId", ParseIntPipe) pointId: number) {
    return this.queuesService.getPointQueue(pointId);
  }

  @Get("my-position")
  getMyPosition(@CurrentDriver() driver: { id: bigint }) {
    return this.queuesService.getMyPosition(driver.id);
  }
}
