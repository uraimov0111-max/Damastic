import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type SmsProvider = "console" | "eskiz";

@Injectable()
export class SmsService {
  constructor(private readonly config: ConfigService) {}

  private eskizToken?: string;

  async sendOneTimePassword(
    phone: string,
    code: string,
    expiresMinutes: number,
  ) {
    const provider = this.getProvider();
    const message = this.buildMessage(code, expiresMinutes);

    if (provider === "console") {
      console.log(`[SMS:console] ${phone} => ${message}`);
      return;
    }

    if (provider === "eskiz") {
      await this.sendViaEskiz(phone, message);
      return;
    }

    throw new ServiceUnavailableException("SMS provider topilmadi");
  }

  private getProvider(): SmsProvider {
    const provider = this.config
      .get<string>("SMS_PROVIDER", "console")
      .toLowerCase();

    if (provider === "eskiz") {
      return "eskiz";
    }

    return "console";
  }

  private buildMessage(code: string, expiresMinutes: number) {
    return this.config
      .get<string>(
        "SMS_MESSAGE_TEMPLATE",
        "Damastic tasdiqlash kodi: {code}. Kod {minutes} daqiqa amal qiladi.",
      )
      .replaceAll("{code}", code)
      .replaceAll("{minutes}", String(expiresMinutes));
  }

  private async sendViaEskiz(phone: string, message: string) {
    const token = await this.getEskizToken();
    const baseUrl = this.getEskizBaseUrl();
    const sendUrl = new URL("message/sms/send", baseUrl).toString();
    const sender = this.config.get<string>("SMS_FROM", "4546");

    const params = new URLSearchParams({
      mobile_phone: phone.replace(/\D/g, ""),
      message,
      from: sender,
    });

    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (response.status === 401 && !this.config.get<string>("SMS_BEARER_TOKEN")) {
      this.eskizToken = undefined;
      const refreshedToken = await this.getEskizToken();
      await this.retryEskizSend(sendUrl, refreshedToken, params);
      return;
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Eskiz SMS yuborish xatosi: ${response.status}`,
      );
    }
  }

  private async retryEskizSend(
    sendUrl: string,
    token: string,
    params: URLSearchParams,
  ) {
    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Eskiz SMS yuborish xatosi: ${response.status}`,
      );
    }
  }

  private async getEskizToken() {
    const staticToken = this.config.get<string>("SMS_BEARER_TOKEN");
    if (staticToken) {
      return staticToken;
    }

    if (this.eskizToken) {
      return this.eskizToken;
    }

    const login = this.config.get<string>("SMS_LOGIN", "");
    const password = this.config.get<string>("SMS_PASSWORD", "");

    if (!login || !password) {
      throw new ServiceUnavailableException("Eskiz login yoki parol topilmadi");
    }

    const authUrl = new URL("auth/login", this.getEskizBaseUrl()).toString();
    const params = new URLSearchParams({
      email: login,
      login,
      password,
    });

    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Eskiz auth xatosi: ${response.status}`,
      );
    }

    const payload = await this.safeJson(response);
    const token = this.extractEskizToken(payload);

    if (!token) {
      throw new ServiceUnavailableException("Eskiz auth token qaytmadi");
    }

    this.eskizToken = token;
    return token;
  }

  private getEskizBaseUrl() {
    const baseUrl = this.config.get<string>(
      "SMS_API_URL",
      "https://notify.eskiz.uz/api",
    );

    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  private extractEskizToken(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return undefined;
    }

    const record = payload as Record<string, unknown>;
    if (typeof record.token === "string" && record.token) {
      return record.token;
    }

    const data = record.data;
    if (!data || typeof data !== "object") {
      return undefined;
    }

    const token = (data as Record<string, unknown>).token;
    return typeof token === "string" && token ? token : undefined;
  }

  private async safeJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
