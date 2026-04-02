import { IsOptional, IsString, Length } from "class-validator";

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(5, 30)
  carNumber?: string;

  @IsOptional()
  @IsString()
  @Length(8, 40)
  cardNumber?: string;
}
