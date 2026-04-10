import { IsOptional, IsPhoneNumber, IsString, Length, Matches } from "class-validator";

export class VerifyCodeDto {
  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsPhoneNumber("UZ")
  phone?: string;

  @IsOptional()
  @Length(4, 8)
  @Matches(/^\d+$/)
  code?: string;
}
