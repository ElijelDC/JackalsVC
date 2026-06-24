import { format } from "date-fns";

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

export function formatMatchDateTime(
  warmUpTime: string,
  matchStart: string,
) {
  const warmUp = new Date(warmUpTime);
  const kickOff = new Date(matchStart);

  return {
    dateLabel: format(kickOff, "EEEE, d MMMM yyyy"),
    timeLabel: `Warm-up ${format(warmUp, "HH:mm")} · Kick-off ${format(kickOff, "HH:mm")}`,
  };
}
