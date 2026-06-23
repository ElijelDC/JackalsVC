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
  ALL_MONTHS_PARAM,
  formatTrainingMonthParam,
  getAdjacentTrainingMonths,
  getTrainingTeamFromList,
  isAllMonthsParam,
  parseScheduleMonthParam,
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
    return { session: null, events: [] };
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

export async function getAllTeamTrainingEvents(trainingTeamKey: string) {
  const session = await getTeamTrainingSession(trainingTeamKey);
  if (!session) return [];

  const dateFilter =
    session.recurringFrom && session.recurringTo
      ? {
          startDate: {
            gte: session.recurringFrom,
            lte: session.recurringTo,
          },
        }
      : {};

  return prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      ...dateFilter,
    },
    orderBy: { startDate: "asc" },
  });
}

export async function userCanSignUpForTrainingEvent(
  userId: string,
  trainingTeamKey: string | null | undefined,
) {
  if (!trainingTeamKey) return false;

  const userTeamKey = await getUserTrainingTeamKey(userId);
  return userTeamKey === trainingTeamKey;
}
