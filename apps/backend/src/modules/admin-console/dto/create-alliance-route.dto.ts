import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

class CreateRoutePointDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(500)
  radius!: number;
}

export class CreateAllianceRouteDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  price!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateRoutePointDto)
  points!: CreateRoutePointDto[];
}
