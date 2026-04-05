import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class CreateAllianceVehicleDto {
  @IsString()
  @Matches(/^[A-Z0-9]{2,12}$/)
  plateNumber!: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(30)
  seatCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  routeId?: number;
}
