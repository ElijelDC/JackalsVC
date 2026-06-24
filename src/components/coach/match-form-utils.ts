import { format } from "date-fns";
import { formatMatchDateTime } from "@/lib/match-config";
import {
  MATCH_VENUES,
  formatMatchTitle,
  formatMatchVenueLabel,
  type MatchVenue,
} from "@/lib/match-config";
import { toDatetimeLocal } from "@/lib/datetime-form";

import type { TeamMatch } from "@/generated/prisma/client";

export type TeamMatchItem = {
  id: string;
  trainingTeamKey: string;
  opponentName: string;
  venue: string;
  location: string;
  warmUpTime: string;
  matchStart: string;
  notes: string | null;
  cancelled: boolean;
};

export type MatchFormState = {
  opponentName: string;
  venue: MatchVenue;
  location: string;
  warmUpTime: string;
  matchStart: string;
  notes: string;
};

export function serializeTeamMatch(match: TeamMatch): TeamMatchItem {
  return {
    id: match.id,
    trainingTeamKey: match.trainingTeamKey,
    opponentName: match.opponentName,
    venue: match.venue,
    location: match.location,
    warmUpTime: match.warmUpTime.toISOString(),
    matchStart: match.matchStart.toISOString(),
    notes: match.notes,
    cancelled: match.cancelled,
  };
}

export function createEmptyMatchForm(): MatchFormState {
  return {
    opponentName: "",
    venue: "HOME",
    location: "",
    warmUpTime: "",
    matchStart: "",
    notes: "",
  };
}

export function matchToFormState(match: TeamMatchItem): MatchFormState {
  return {
    opponentName: match.opponentName,
    venue: (match.venue as MatchVenue) ?? "HOME",
    location: match.location,
    warmUpTime: toDatetimeLocal(match.warmUpTime),
    matchStart: toDatetimeLocal(match.matchStart),
    notes: match.notes ?? "",
  };
}

export function buildMatchPayload(
  trainingTeamKey: string,
  form: MatchFormState,
) {
  return {
    trainingTeamKey,
    opponentName: form.opponentName,
    venue: form.venue,
    location: form.location,
    warmUpTime: form.warmUpTime,
    matchStart: form.matchStart,
    notes: form.notes || undefined,
  };
}

export function formatMatchRowTitle(match: TeamMatchItem) {
  return formatMatchTitle(match.opponentName, match.venue);
}

export function formatMatchRowMeta(match: TeamMatchItem) {
  const { timeLabel } = formatMatchDateTime(match.warmUpTime, match.matchStart);
  return [
    formatMatchVenueLabel(match.venue),
    match.location,
    `${format(new Date(match.matchStart), "d MMM yyyy")} · ${timeLabel}`,
  ].join(" · ");
}

export { MATCH_VENUES, formatMatchVenueLabel };
export { toDatetimeLocal } from "@/lib/datetime-form";
