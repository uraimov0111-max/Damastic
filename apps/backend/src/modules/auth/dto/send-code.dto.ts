import { IsPhoneNumber } from "class-validator";

export class SendCodeDto {
  @IsPhoneNumber("UZ")
  phone!: string;
}
