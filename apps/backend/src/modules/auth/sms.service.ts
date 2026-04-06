import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type SmsProvider = "console" | "eskiz";
type EskizTokenSource = "static" | "login";

type EskizSession = {
  source: EskizTokenSource;
  token: string;
  tokenType: string;
};

@Injectable()
export class SmsService {
  constructor(private readonly config: ConfigService) {}

  private eskizSession?: EskizSession;

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

  async getProviderStatus() {
    const provider = this.getProvider();
    const checkedAt = new Date().toISOString();
    const sender = this.config.get<string>("SMS_FROM", "4546");

    if (provider === "console") {
      return {
        provider,
        mode: "console",
        sender,
        apiBaseUrl: null,
        tokenSource: "console",
        authorized: false,
        userName: null,
        userEmail: null,
        balance: null,
        checkedAt,
        error: null,
      };
    }

    try {
      const session = await this.getEskizSession();
      const [userPayload, limitPayload] = await Promise.all([
        this.requestEskizJson("auth/user", {
          method: "GET",
        }),
        this.requestEskizJson("user/get-limit", {
          method: "GET",
        }),
      ]);

      const user = this.extractEskizData(userPayload);
      const limit = this.extractEskizData(limitPayload);

      return {
        provider,
        mode: "live",
        sender,
        apiBaseUrl: this.getEskizBaseUrl(),
        tokenSource: session.source,
        authorized: true,
        userName: this.pickString(user, [
          "name",
          "full_name",
          "fullname",
          "username",
          "company",
        ]),
        userEmail: this.pickString(user, ["email", "login"]),
        balance: this.pickNumber(limit, [
          "balance",
          "limit",
          "sms_limit",
          "smsLimit",
          "credit",
          "remain",
          "remaining",
          "available",
        ]),
        checkedAt,
        error: null,
      };
    } catch (error) {
      return {
        provider,
        mode: "live",
        sender,
        apiBaseUrl: this.getEskizBaseUrl(),
        tokenSource: this.config.get<string>("SMS_BEARER_TOKEN") ? "static" : "login",
        authorized: false,
        userName: null,
        userEmail: null,
        balance: null,
        checkedAt,
        error:
          error instanceof Error ? error.message : "Eskiz statusini olishda xato yuz berdi",
      };
    }
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
    if (this.isEskizTestMode()) {
      return this.config.get<string>(
        "SMS_TEST_FALLBACK_MESSAGE",
        "Bu Eskiz dan test",
      );
    }

    return this.config
      .get<string>(
        "SMS_MESSAGE_TEMPLATE",
        "Damastic tasdiqlash kodi: {code}. Kod {minutes} daqiqa amal qiladi.",
      )
      .replaceAll("{code}", code)
      .replaceAll("{minutes}", String(expiresMinutes));
  }

  private async sendViaEskiz(phone: string, message: string) {
    const sender = this.config.get<string>("SMS_FROM", "4546");
    const params = new URLSearchParams({
      mobile_phone: phone.replace(/\D/g, ""),
      message,
      from: sender,
    });

    await this.requestEskiz("message/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
  }

  private async requestEskizJson(path: string, options: RequestInit = {}) {
    const response = await this.requestEskiz(path, options);
    return this.safeJson(response);
  }

  private async requestEskiz(path: string, options: RequestInit = {}) {
    const requestUrl = new URL(path, this.getEskizBaseUrl()).toString();
    let session = await this.getEskizSession();
    let response = await this.performEskizFetch(requestUrl, options, session);

    if (response.status === 401 && session.source === "login") {
      try {
        session = await this.refreshEskizSession(session);
      } catch {
        this.clearEskizSession();
        session = await this.getEskizSession({ force: true });
      }

      response = await this.performEskizFetch(requestUrl, options, session);
    }

    if (!response.ok) {
      const payload = await this.safeJson(response);
      const message = this.extractErrorMessage(payload);
      throw new ServiceUnavailableException(
        `Eskiz ${path} xatosi: ${response.status}${message ? ` - ${message}` : ""}`,
      );
    }

    return response;
  }

  private async performEskizFetch(
    requestUrl: string,
    options: RequestInit,
    session: EskizSession,
  ) {
    const headers = new Headers(options.headers ?? {});
    headers.set("Accept", "application/json");
    headers.set("Authorization", this.buildEskizAuthorization(session));

    return fetch(requestUrl, {
      ...options,
      headers,
    });
  }

  private async getEskizSession(options: { force?: boolean } = {}) {
    const staticToken = this.config.get<string>("SMS_BEARER_TOKEN");
    if (staticToken) {
      return {
        source: "static" as const,
        token: staticToken,
        tokenType: "Bearer",
      };
    }

    if (!options.force && this.eskizSession) {
      return this.eskizSession;
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

    this.eskizSession = {
      source: "login",
      token,
      tokenType: this.extractEskizTokenType(payload) ?? "Bearer",
    };

    return this.eskizSession;
  }

  private async refreshEskizSession(session: EskizSession) {
    const refreshUrl = new URL("auth/refresh", this.getEskizBaseUrl()).toString();
    const response = await this.performEskizFetch(
      refreshUrl,
      { method: "PATCH" },
      session,
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Eskiz auth refresh xatosi: ${response.status}`,
      );
    }

    const payload = await this.safeJson(response);
    const token = this.extractEskizToken(payload);

    if (!token) {
      throw new ServiceUnavailableException("Eskiz refresh token qaytmadi");
    }

    this.eskizSession = {
      source: "login",
      token,
      tokenType: this.extractEskizTokenType(payload) ?? session.tokenType ?? "Bearer",
    };

    return this.eskizSession;
  }

  private clearEskizSession() {
    this.eskizSession = undefined;
  }

  private getEskizBaseUrl() {
    const baseUrl = this.config.get<string>(
      "SMS_API_URL",
      "https://notify.eskiz.uz/api",
    );

    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  private isEskizTestMode() {
    return this.config.get<boolean>("SMS_TEST_MODE", false);
  }

  private buildEskizAuthorization(session: EskizSession) {
    const tokenType = session.tokenType || "Bearer";
    return `${tokenType.charAt(0).toUpperCase()}${tokenType.slice(1)} ${session.token}`;
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

  private extractEskizTokenType(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return undefined;
    }

    const record = payload as Record<string, unknown>;
    if (typeof record.token_type === "string" && record.token_type) {
      return record.token_type;
    }

    const data = record.data;
    if (!data || typeof data !== "object") {
      return undefined;
    }

    const tokenType = (data as Record<string, unknown>).token_type;
    return typeof tokenType === "string" && tokenType ? tokenType : undefined;
  }

  private extractEskizData(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return {};
    }

    const record = payload as Record<string, unknown>;
    const data = record.data;
    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }

    return record;
  }

  private pickString(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private pickNumber(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private extractErrorMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return undefined;
    }

    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }

    const data = record.data;
    if (!data || typeof data !== "object") {
      return undefined;
    }

    const dataRecord = data as Record<string, unknown>;
    if (typeof dataRecord.message === "string" && dataRecord.message.trim()) {
      return dataRecord.message.trim();
    }

    return undefined;
  }

  private async safeJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
