import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required for registration tokens");
  }
  return secret;
}

export function createRegistrationToken(vlyNumber: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${vlyNumber}:${expiresAt}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyRegistrationToken(
  token: string,
  vlyNumber: string,
): { valid: boolean; error?: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [number, expiresAtRaw, signature] = decoded.split(":");

    if (!number || !expiresAtRaw || !signature) {
      return { valid: false, error: "Invalid registration session" };
    }

    if (number !== vlyNumber) {
      return { valid: false, error: "Registration session does not match this VLY number" };
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: "Registration session expired — please verify your VLY number again" };
    }

    const payload = `${number}:${expiresAtRaw}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const validSignature = timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    );

    if (!validSignature) {
      return { valid: false, error: "Invalid registration session" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid registration session" };
  }
}
