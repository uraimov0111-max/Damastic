type EnvInput = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function asNumber(env: EnvInput, key: string, fallback: number) {
  const raw = env[key];

  if (raw == null || raw === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a valid number`);
  }

  return parsed;
}

function asBoolean(env: EnvInput, key: string, fallback: boolean) {
  const raw = asString(env[key], "");
  if (!raw) {
    return fallback;
  }

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  throw new Error(`${key} must be either "true" or "false"`);
}

function assertProductionSecret(name: string, value: string) {
  if (!value || value === "change-me" || value === "change_me") {
    throw new Error(`${name} must be configured for production`);
  }
}

export function validateEnv(env: EnvInput) {
  const nodeEnv = asString(env.NODE_ENV, "development");
  const smsProvider = asString(env.SMS_PROVIDER, "console").toLowerCase();
  const paymentBaseUrl = asString(
    env.PAYMENT_BASE_URL,
    "https://pay.damastic.uz",
  );

  const normalized = {
    ...env,
    NODE_ENV: nodeEnv,
    PORT: asNumber(env, "PORT", 4000),
    JWT_SECRET: asString(env.JWT_SECRET, "change-me"),
    JWT_EXPIRES_IN: asString(env.JWT_EXPIRES_IN, "7d"),
    OTP_EXPIRES_MINUTES: asNumber(env, "OTP_EXPIRES_MINUTES", 5),
    OTP_LENGTH: asNumber(env, "OTP_LENGTH", 6),
    OTP_RESEND_INTERVAL_SECONDS: asNumber(
      env,
      "OTP_RESEND_INTERVAL_SECONDS",
      60,
    ),
    OTP_MAX_SEND_PER_HOUR: asNumber(env, "OTP_MAX_SEND_PER_HOUR", 5),
    OTP_MAX_VERIFY_ATTEMPTS: asNumber(env, "OTP_MAX_VERIFY_ATTEMPTS", 5),
    AUTH_EXPOSE_DEBUG_CODE: asBoolean(env, "AUTH_EXPOSE_DEBUG_CODE", false),
    DEFAULT_ROUTE_PRICE: asNumber(env, "DEFAULT_ROUTE_PRICE", 5000),
    PAYMENT_BASE_URL: paymentBaseUrl,
    PAYMENT_ALLOW_UNSIGNED_CALLBACKS: asBoolean(
      env,
      "PAYMENT_ALLOW_UNSIGNED_CALLBACKS",
      nodeEnv !== "production",
    ),
    CLICK_SECRET_KEY: asString(env.CLICK_SECRET_KEY, "change-me"),
    PAYME_SECRET_KEY: asString(env.PAYME_SECRET_KEY, "change-me"),
    SMS_PROVIDER: smsProvider,
    SMS_API_URL: asString(env.SMS_API_URL, "https://notify.eskiz.uz/api"),
    SMS_LOGIN: asString(env.SMS_LOGIN),
    SMS_PASSWORD: asString(env.SMS_PASSWORD),
    SMS_BEARER_TOKEN: asString(env.SMS_BEARER_TOKEN),
    SMS_FROM: asString(env.SMS_FROM, "4546"),
    SMS_MESSAGE_TEMPLATE: asString(
      env.SMS_MESSAGE_TEMPLATE,
      "Damastic tasdiqlash kodi: {code}. Kod {minutes} daqiqa amal qiladi.",
    ),
  };

  if (normalized.OTP_LENGTH < 4 || normalized.OTP_LENGTH > 8) {
    throw new Error("OTP_LENGTH must be between 4 and 8");
  }

  if (normalized.OTP_RESEND_INTERVAL_SECONDS < 0) {
    throw new Error("OTP_RESEND_INTERVAL_SECONDS must be non-negative");
  }

  if (normalized.OTP_MAX_SEND_PER_HOUR < 1) {
    throw new Error("OTP_MAX_SEND_PER_HOUR must be at least 1");
  }

  if (normalized.OTP_MAX_VERIFY_ATTEMPTS < 1) {
    throw new Error("OTP_MAX_VERIFY_ATTEMPTS must be at least 1");
  }

  if (nodeEnv === "production") {
    assertProductionSecret("JWT_SECRET", normalized.JWT_SECRET);
    assertProductionSecret("CLICK_SECRET_KEY", normalized.CLICK_SECRET_KEY);
    assertProductionSecret("PAYME_SECRET_KEY", normalized.PAYME_SECRET_KEY);

    if (!paymentBaseUrl.startsWith("https://")) {
      throw new Error("PAYMENT_BASE_URL must use https in production");
    }
  }

  if (smsProvider === "eskiz") {
    const hasBearerToken = Boolean(normalized.SMS_BEARER_TOKEN);
    const hasLoginPassword = Boolean(
      normalized.SMS_LOGIN && normalized.SMS_PASSWORD,
    );

    if (!hasBearerToken && !hasLoginPassword) {
      throw new Error(
        "Eskiz SMS requires SMS_BEARER_TOKEN or SMS_LOGIN and SMS_PASSWORD",
      );
    }

    if (!normalized.SMS_FROM) {
      throw new Error("SMS_FROM must be configured for Eskiz");
    }
  }

  return normalized;
}
