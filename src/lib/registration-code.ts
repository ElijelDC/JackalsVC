import type { RegistrationCode } from "@/generated/prisma/client";

export function normalizeClubCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateRegistrationCode(
  code: RegistrationCode | null,
): string | null {
  if (!code) return "Invalid club code. Check the code from your coach or committee.";
  if (!code.active) return "This club code is no longer active.";
  if (code.expiresAt && code.expiresAt < new Date()) {
    return "This club code has expired. Contact the club for a new one.";
  }
  if (code.maxUses !== null && code.usedCount >= code.maxUses) {
    return "This club code has reached its usage limit.";
  }
  return null;
}
