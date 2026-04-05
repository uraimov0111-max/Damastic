import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, savedKey] = storedHash.split(":");
  if (!salt || !savedKey) {
    return false;
  }

  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  const left = Buffer.from(derived, "hex");
  const right = Buffer.from(savedKey, "hex");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
