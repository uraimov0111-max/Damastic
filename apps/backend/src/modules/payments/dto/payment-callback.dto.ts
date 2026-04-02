import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PaymentCallbackDto {
  @IsInt()
  @Min(1)
  driverId!: number;

  @IsNumber()
  amount!: number;

  @IsIn(["pending", "success", "failed"])
  status!: "pending" | "success" | "failed";

  @IsString()
  transactionId!: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
