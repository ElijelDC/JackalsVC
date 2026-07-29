import "server-only";

import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

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

function uniqueTeamKeys(keys: Array<string | null | undefined>): string[] {
  return [...new Set(keys.filter((key): key is string => Boolean(key)))];
}

export function normalizeTrainingTeamKeys(
  keys: string | string[] | null | undefined,
): string[] {
  if (!keys) return [];
  return uniqueTeamKeys(Array.isArray(keys) ? keys : [keys]);
}

/** All squads the user belongs to (coaches may have multiple via coachSquads). */
export async function getUserTrainingTeamKeys(userId: string | undefined) {
  if (!userId) return [] as string[];

  const clubMember = await prisma.clubMember.findFirst({
    where: { userId },
    select: {
      rosterRole: true,
      trainingTeamKey: true,
      coachSquads: { select: { trainingTeamKey: true } },
    },
  });

  if (!clubMember) return [];

  if (clubMember.rosterRole === "COACH") {
    const fromJoin = clubMember.coachSquads.map((row) => row.trainingTeamKey);
    const keys = uniqueTeamKeys([...fromJoin, clubMember.trainingTeamKey]);
    if (
      clubMember.trainingTeamKey &&
      keys.includes(clubMember.trainingTeamKey)
    ) {
      return [
        clubMember.trainingTeamKey,
        ...keys.filter((key) => key !== clubMember.trainingTeamKey),
      ];
    }
    return keys;
  }

  return clubMember.trainingTeamKey ? [clubMember.trainingTeamKey] : [];
}

/** Primary / first squad key (for single-team callers). */
export async function getUserTrainingTeamKey(userId: string | undefined) {
  const keys = await getUserTrainingTeamKeys(userId);
  return keys[0] ?? null;
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

  const userTeamKeys = await getUserTrainingTeamKeys(userId);
  return userTeamKeys.includes(trainingTeamKey);
}

export async function getMonthlyTrainingEventsForTeams(
  trainingTeamKeys: string[],
  month: Date,
) {
  const results = await Promise.all(
    trainingTeamKeys.map(async (trainingTeamKey) => {
      const { session, events } = await getMonthlyTeamTrainingEvents(
        trainingTeamKey,
        month,
      );
      return { trainingTeamKey, session, events };
    }),
  );

  const events = results
    .flatMap(({ trainingTeamKey, events: teamEvents }) =>
      teamEvents.map((event) => ({ ...event, trainingTeamKey })),
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return { results, events };
}
