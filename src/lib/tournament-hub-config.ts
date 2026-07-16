export type TournamentScheduleRow = {
  time: string;
  court1: string;
  refereePoolB: string;
  court2: string;
  refereePoolA: string;
  highlight?: boolean;
};

import { PUBLIC_PATHS } from "@/lib/public-paths";

export type TournamentHubConfig = {
  slug: string;
  /** Production (and local) event ids that should link to this hub. */
  eventIds: string[];
  reclubReferenceCodes: string[];
  title: string;
  subtitle: string;
  location: string;
  dateLabel: string;
  scheduleNote?: string;
  schedule: TournamentScheduleRow[];
  /** Fallback rules PDF under /public when Event.rulesPdfUrl is unset. */
  defaultRulesPdfUrl?: string | null;
};

export const TOURNAMENT_HUBS: TournamentHubConfig[] = [
  {
    slug: "jvc-mixed-2v2-beach",
    eventIds: ["cmret3n0j000123o06wzbz90i"],
    reclubReferenceCodes: ["019e6e36-4bf3-786b-8e8b-cb5e1ed48f05"],
    title: "JVC Mixed 2v2 Beach Tournament",
    subtitle: "Pool play schedule & tournament rules",
    location: "Sport Ireland Campus, Dublin, Blanchardstown",
    dateLabel: "Saturday, 18 July 2026",
    scheduleNote:
      "Pool A plays on Court 1. Pool B plays on Court 2. Each team referees the other pool when listed.",
    schedule: [
      {
        time: "10:00",
        court1: "GATTIS vs Les Whiskas",
        refereePoolB: "YOU & I",
        court2: "THE SMURFS vs R.O.U.S",
        refereePoolA: "DOUBLE Trouble",
      },
      {
        time: "10:17",
        court1: "DOUBLE Trouble vs HIGH ROLLERS CLUB",
        refereePoolB: "PAREJA EXPLOSIVA",
        court2: "YOU & I vs BILOWILO",
        refereePoolA: "STILL",
      },
      {
        time: "10:34",
        court1: "STILL vs Les Whiskas",
        refereePoolB: "R.O.U.S",
        court2: "THE SMURFS vs PAREJA EXPLOSIVA",
        refereePoolA: "HIGH ROLLERS CLUB",
      },
      {
        time: "10:51",
        court1: "GATTIS vs DOUBLE Trouble",
        refereePoolB: "BILOWILO",
        court2: "YOU & I vs R.O.U.S",
        refereePoolA: "Les Whiskas",
      },
      {
        time: "11:08",
        court1: "HIGH ROLLERS CLUB vs STILL",
        refereePoolB: "THE SMURFS",
        court2: "BILOWILO vs PAREJA EXPLOSIVA",
        refereePoolA: "GATTIS",
      },
      {
        time: "11:25",
        court1: "DOUBLE Trouble vs Les Whiskas",
        refereePoolB: "R.O.U.S",
        court2: "YOU & I vs THE SMURFS",
        refereePoolA: "HIGH ROLLERS CLUB",
      },
      {
        time: "11:42",
        court1: "GATTIS vs STILL",
        refereePoolB: "BILOWILO",
        court2: "PAREJA EXPLOSIVA vs R.O.U.S",
        refereePoolA: "DOUBLE Trouble",
      },
      {
        time: "11:59",
        court1: "HIGH ROLLERS CLUB vs Les Whiskas",
        refereePoolB: "YOU & I",
        court2: "BILOWILO vs THE SMURFS",
        refereePoolA: "GATTIS",
      },
      {
        time: "12:16",
        court1: "DOUBLE Trouble vs STILL",
        refereePoolB: "THE SMURFS",
        court2: "YOU & I vs PAREJA EXPLOSIVA",
        refereePoolA: "Les Whiskas",
      },
      {
        time: "12:33",
        court1: "GATTIS vs HIGH ROLLERS CLUB",
        refereePoolB: "PAREJA EXPLOSIVA",
        court2: "BILOWILO vs R.O.U.S",
        refereePoolA: "STILL",
      },
    ],
    defaultRulesPdfUrl: PUBLIC_PATHS.downloads.beachTournamentRules,
  },
];

export function getTournamentHubBySlug(slug: string) {
  return TOURNAMENT_HUBS.find((hub) => hub.slug === slug) ?? null;
}

export function getTournamentHubForEvent(event: {
  id: string;
  reclubReferenceCode?: string | null;
}) {
  return (
    TOURNAMENT_HUBS.find(
      (hub) =>
        hub.eventIds.includes(event.id) ||
        (event.reclubReferenceCode != null &&
          hub.reclubReferenceCodes.includes(event.reclubReferenceCode)),
    ) ?? null
  );
}

export function tournamentHubPath(slug: string) {
  return `/tournaments/${slug}`;
}
