export const RECLUB_MEET_URL_PATTERN =
  /^https?:\/\/(?:www\.)?reclub\.co\/m\/([A-Za-z0-9]+)\/?$/i;

export const RECLUB_COMPETITION_URL_PATTERN =
  /^https?:\/\/(?:www\.)?reclub\.co\/c\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?/i;

export const DEFAULT_RECLUB_CLUB_SLUG = "jackals-volleyball";
export const DEFAULT_RECLUB_GROUP_ID = 9245;

export function reclubClubUrl(slug = DEFAULT_RECLUB_CLUB_SLUG) {
  return `https://reclub.co/clubs/@${slug}`;
}

export const RECLUB_CLUB_URL = reclubClubUrl();

export function reclubCompetitionUrl(
  competitionId: string,
  accessToken?: string | null,
) {
  const url = `https://reclub.co/c/${competitionId}`;
  if (accessToken?.trim()) {
    return `${url}?at=${encodeURIComponent(accessToken.trim())}`;
  }
  return url;
}

export function isReclubCompetitionId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

export function reclubMeetUrl(referenceCode: string) {
  return `https://reclub.co/m/${referenceCode}`;
}

export function isExternalAttendanceUrl(
  url: string | null | undefined,
): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
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

export function parseReclubCompetitionId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isReclubCompetitionId(trimmed)) {
    return trimmed;
  }

  const urlMatch = trimmed.match(RECLUB_COMPETITION_URL_PATTERN);
  return urlMatch?.[1] ?? null;
}

export function parseReclubCompetitionAccessToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get("at")?.trim();
    return token || null;
  } catch {
    const match = trimmed.match(/[?&]at=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
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
