export function normalizeVlyNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidVlyNumberFormat(value: string): boolean {
  const normalized = normalizeVlyNumber(value);
  return /^VLY\d{3,8}$/.test(normalized);
}
