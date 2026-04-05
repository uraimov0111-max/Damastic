import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class CreateAllianceDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]{3,40}$/)
  slug!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  adminFullName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  adminPassword?: string;
}
