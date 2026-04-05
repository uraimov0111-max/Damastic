import { IsInt, IsOptional, IsPhoneNumber, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateAllianceDriverDto {
  @IsString()
  name!: string;

  @IsPhoneNumber("UZ")
  phone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  routeId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicleId!: number;

  @IsOptional()
  @IsString()
  cardNumber?: string;
}
