import "server-only";

import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SESSION_CATEGORIES } from "@/lib/training-utils";
import {
  getTrainingSquads,
  getTrainingTeamByKey,
  isTrainingSquadKey,
} from "@/lib/training-squads";

export {
  formatTrainingMonthParam,
  getAdjacentTrainingMonths,
  getTrainingTeamFromList,
  parseTrainingMonthParam,
  type TrainingTeam,
} from "@/lib/training-teams-config";

export {
  getTrainingSquads,
  getTrainingTeamByKey,
  isTrainingSquadKey,
} from "@/lib/training-squads";

export async function getUserTrainingTeamKey(userId: string | undefined) {
  if (!userId) return null;

  const clubMember = await prisma.clubMember.findFirst({
    where: { userId },
    select: { trainingTeamKey: true },
  });

  return clubMember?.trainingTeamKey ?? null;
}

export async function getTeamTrainingSession(trainingTeamKey: string) {
  return prisma.trainingSession.findFirst({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey,
    },
  });
}

export async function getMonthlyTeamTrainingEvents(
  trainingTeamKey: string,
  month: Date,
) {
  const session = await getTeamTrainingSession(trainingTeamKey);
  if (!session) {
    return { session: null, events: [] as const };
  }

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      startDate: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { startDate: "asc" },
  });

  return { session, events };
}

export async function userCanSignUpForTrainingEvent(
  userId: string,
  trainingTeamKey: string | null | undefined,
) {
  if (!trainingTeamKey) return false;

  const userTeamKey = await getUserTrainingTeamKey(userId);
  return userTeamKey === trainingTeamKey;
}
