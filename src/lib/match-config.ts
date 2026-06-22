export const MATCH_VENUES = ["HOME", "AWAY"] as const;

export type MatchVenue = (typeof MATCH_VENUES)[number];

export function formatMatchVenueLabel(venue: string) {
  return venue === "HOME" ? "Home" : venue === "AWAY" ? "Away" : venue;
}

export function formatMatchTitle(opponentName: string, venue: string) {
  return venue === "HOME"
    ? `vs ${opponentName}`
    : venue === "AWAY"
      ? `@ ${opponentName}`
      : `vs ${opponentName}`;
}
