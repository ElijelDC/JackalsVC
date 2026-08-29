export function normalizeVlyNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isMissingVlyNumber(value: string | null | undefined): boolean {
  return !value?.trim();
}

/** Empty / whitespace → null; otherwise normalized uppercase. */
export function normalizeOptionalVlyNumber(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const normalized = normalizeVlyNumber(value);
  return normalized.length > 0 ? normalized : null;
}

export function isValidVlyNumberFormat(value: string): boolean {
  const normalized = normalizeVlyNumber(value);
  return /^VLY([1-9]\d{0,4})$/.test(normalized);
}

export function isValidVlyCoachNumberFormat(value: string): boolean {
  const normalized = normalizeVlyNumber(value);
  return /^VLYC([1-9]\d{0,4})$/.test(normalized);
}

export function isValidClubMemberNumberForRole(
  value: string,
  rosterRole: "PLAYER" | "COACH",
): boolean {
  return rosterRole === "COACH"
    ? isValidVlyCoachNumberFormat(value)
    : isValidVlyNumberFormat(value);
}
