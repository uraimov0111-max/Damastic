import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentCallbackDto } from "./dto/payment-callback.dto";

@Injectable()
export class PaymentSignatureService {
  constructor(private readonly config: ConfigService) {}

  validateCallback(
    system: "click" | "payme",
    dto: PaymentCallbackDto,
    signature?: string,
  ) {
    const allowUnsigned = this.config.get<boolean>(
      "PAYMENT_ALLOW_UNSIGNED_CALLBACKS",
      process.env.NODE_ENV !== "production",
    );

    if (!signature) {
      if (allowUnsigned) {
        return false;
      }

      throw new UnauthorizedException("Callback imzosi talab qilinadi");
    }

    const secretKey = this.config.get<string>(
      system === "click" ? "CLICK_SECRET_KEY" : "PAYME_SECRET_KEY",
      "",
    );

    if (!secretKey || secretKey === "change-me") {
      throw new ServiceUnavailableException(
        `${system.toUpperCase()} secret key sozlanmagan`,
      );
    }

    const normalizedSignature = signature.replace(/^sha256=/i, "").trim();
    const expectedSignature = createHmac("sha256", secretKey)
      .update(
        `${dto.driverId}:${dto.transactionId}:${dto.amount}:${dto.status}`,
      )
      .digest("hex");

    const isValid = this.safeCompare(expectedSignature, normalizedSignature);
    if (!isValid && !allowUnsigned) {
      throw new UnauthorizedException("Callback imzosi noto'g'ri");
    }

    return isValid;
  }

  private safeCompare(left: string, right: string) {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
