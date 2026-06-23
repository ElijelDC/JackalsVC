import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DAYS_OF_WEEK } from "@/lib/utils";
import type { TrainingTeam } from "@/lib/training-teams-config";

export function dayLabelFromDayOfWeek(dayOfWeek: number) {
  return DAYS_OF_WEEK[dayOfWeek] ?? "Unknown";
}

export function toTrainingTeam(squad: {
  key: string;
  name: string;
  dayOfWeek: number;
}): TrainingTeam {
  return {
    key: squad.key,
    name: squad.name,
    dayOfWeek: squad.dayOfWeek,
    dayLabel: dayLabelFromDayOfWeek(squad.dayOfWeek),
  };
}

export const getTrainingSquads = cache(async (options?: { includeInactive?: boolean }) => {
  const squads = await prisma.trainingSquad.findMany({
    where: options?.includeInactive ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return squads.map(toTrainingTeam);
});

export async function getTrainingTeamByKey(key: string | null | undefined) {
  if (!key) return null;

  const squad = await prisma.trainingSquad.findUnique({ where: { key } });
  return squad ? toTrainingTeam(squad) : null;
}

export async function isTrainingSquadKey(key: string, options?: { activeOnly?: boolean }) {
  const squad = await prisma.trainingSquad.findUnique({
    where: { key },
    select: { active: true },
  });

  if (!squad) return false;
  if (options?.activeOnly === false) return true;
  return squad.active;
}

export function slugifyTrainingSquadKey(name: string) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  return slug || "SQUAD";
}

export async function syncTrainingSquadDayFromSession(session: {
  trainingTeamKey: string | null;
  dayOfWeek: number;
}) {
  if (!session.trainingTeamKey) return;

  await prisma.trainingSquad.updateMany({
    where: { key: session.trainingTeamKey },
    data: { dayOfWeek: session.dayOfWeek },
  });
}

export async function getTrainingSquadUsageCounts(key: string) {
  const [members, sessions, matches] = await Promise.all([
    prisma.clubMember.count({ where: { trainingTeamKey: key } }),
    prisma.trainingSession.count({ where: { trainingTeamKey: key } }),
    prisma.teamMatch.count({ where: { trainingTeamKey: key } }),
  ]);

  return { members, sessions, matches, total: members + sessions + matches };
}
