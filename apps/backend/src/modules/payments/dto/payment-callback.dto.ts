import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PaymentCallbackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  driverId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsIn(["pending", "success", "failed"])
  status!: "pending" | "success" | "failed";

  @IsString()
  transactionId!: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
