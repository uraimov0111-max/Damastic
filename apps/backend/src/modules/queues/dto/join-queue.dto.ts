import { IsInt, Min } from "class-validator";

export class JoinQueueDto {
  @IsInt()
  @Min(1)
  pointId!: number;
}
