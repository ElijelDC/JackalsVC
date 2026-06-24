export function normalizeVlyNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
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
