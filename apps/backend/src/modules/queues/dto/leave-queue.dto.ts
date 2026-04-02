import { IsInt, IsOptional, Min } from "class-validator";

export class LeaveQueueDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  pointId?: number;
}
