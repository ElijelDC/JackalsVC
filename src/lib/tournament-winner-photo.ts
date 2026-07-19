/** Client-safe tournament winner photo kinds / labels (no server imports). */

export const TOURNAMENT_WINNER_PHOTO_KINDS = [
  "PODIUM",
  "FIRST",
  "SECOND",
  "THIRD",
  "OTHER",
] as const;

export type TournamentWinnerPhotoKind =
  (typeof TOURNAMENT_WINNER_PHOTO_KINDS)[number];

export const TOURNAMENT_WINNER_KIND_LABELS: Record<
  TournamentWinnerPhotoKind,
  string
> = {
  PODIUM: "Podium (group)",
  FIRST: "1st place",
  SECOND: "2nd place",
  THIRD: "3rd place",
  OTHER: "Other",
};

export function isTournamentWinnerPhotoKind(
  value: string,
): value is TournamentWinnerPhotoKind {
  return (TOURNAMENT_WINNER_PHOTO_KINDS as readonly string[]).includes(value);
}

export function defaultAltForWinnerPhoto(
  kind: TournamentWinnerPhotoKind,
  tournamentTitle: string,
) {
  switch (kind) {
    case "PODIUM":
      return `${tournamentTitle} — podium`;
    case "FIRST":
      return `${tournamentTitle} — 1st place`;
    case "SECOND":
      return `${tournamentTitle} — 2nd place`;
    case "THIRD":
      return `${tournamentTitle} — 3rd place`;
    default:
      return `${tournamentTitle} — winners`;
  }
}
