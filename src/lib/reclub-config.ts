export const RECLUB_MEET_URL_PATTERN =
  /^https?:\/\/(?:www\.)?reclub\.co\/m\/([A-Za-z0-9]+)\/?$/i;

export const DEFAULT_RECLUB_CLUB_SLUG = "jackals-volleyball";

export function reclubMeetUrl(referenceCode: string) {
  return `https://reclub.co/m/${referenceCode}`;
}

export function parseReclubReferenceCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(RECLUB_MEET_URL_PATTERN);
  if (urlMatch) return urlMatch[1].toUpperCase();

  if (/^[A-Za-z0-9]{4,12}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

export function getReclubWatchReferenceCodes(): string[] {
  const raw = process.env.RECLUB_SYNC_REFERENCE_CODES ?? "";
  return [
    ...new Set(
      raw
        .split(/[,\s]+/)
        .map((value) => parseReclubReferenceCode(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}
