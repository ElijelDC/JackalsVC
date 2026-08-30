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
  const [members, coachLinks, sessions, matches, clubTeams] =
    await Promise.all([
      prisma.clubMember.count({ where: { trainingTeamKey: key } }),
      prisma.clubMemberCoachSquad.count({ where: { trainingTeamKey: key } }),
      prisma.trainingSession.count({ where: { trainingTeamKey: key } }),
      prisma.teamMatch.count({ where: { trainingTeamKey: key } }),
      prisma.clubTeam.count({ where: { trainingTeamKey: key } }),
    ]);

  return {
    members,
    coachLinks,
    sessions,
    matches,
    clubTeams,
    total: members + coachLinks + sessions + matches + clubTeams,
  };
}

export async function deleteTrainingSquadCascade(id: string) {
  const existing = await prisma.trainingSquad.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Squad not found");
  }

  const usage = await getTrainingSquadUsageCounts(existing.key);
  if (usage.members > 0) {
    throw new Error(
      `This squad still has ${usage.members} roster member${usage.members === 1 ? "" : "s"}. Reassign them first.`,
    );
  }

  const sessions = await prisma.trainingSession.findMany({
    where: { trainingTeamKey: existing.key },
    select: { id: true },
  });

  const { deleteTrainingSessionCascade } = await import("@/lib/training-events");
  for (const session of sessions) {
    await deleteTrainingSessionCascade(session.id);
  }

  await prisma.teamMatch.deleteMany({
    where: { trainingTeamKey: existing.key },
  });

  await prisma.clubMemberCoachSquad.deleteMany({
    where: { trainingTeamKey: existing.key },
  });

  await prisma.clubTeam.updateMany({
    where: { trainingTeamKey: existing.key },
    data: { trainingTeamKey: null },
  });

  await prisma.trainingSquad.delete({ where: { id } });

  return {
    deletedSessions: sessions.length,
    deletedMatches: usage.matches,
  };
}
