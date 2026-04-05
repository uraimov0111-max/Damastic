import { IsPhoneNumber, Length, Matches } from "class-validator";

export class VerifyCodeDto {
  @IsPhoneNumber("UZ")
  phone!: string;

  @Length(4, 8)
  @Matches(/^\d+$/)
  code!: string;
}
