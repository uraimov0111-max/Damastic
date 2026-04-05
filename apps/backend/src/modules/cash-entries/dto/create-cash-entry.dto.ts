import { IsInt, Max, Min } from "class-validator";

export class CreateCashEntryDto {
  @IsInt()
  @Min(1)
  @Max(30)
  passengerCount!: number;
}
