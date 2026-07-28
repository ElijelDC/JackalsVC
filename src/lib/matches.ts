import "server-only";

import { endOfMonth, startOfMonth } from "date-fns";
import { getUserMatchAttendanceStatuses } from "@/lib/match-attendance";
import { formatMatchTitle } from "@/lib/match-config";
import { prisma } from "@/lib/prisma";
import {
  getResponseWindowEndDate,
  TRAINING_RESPONSE_OPENS_DAYS,
} from "@/lib/training-attendance-config";
import { parseTrainingMonthParam } from "@/lib/training-teams";

export async function resolveMatchesMonth(
  trainingTeamKeys: string | string[],
  monthParam: string | undefined,
) {
  const keys = Array.isArray(trainingTeamKeys)
    ? trainingTeamKeys
    : [trainingTeamKeys];
  const month = parseTrainingMonthParam(monthParam);
  if (monthParam || keys.length === 0) return month;

  const currentMonthMatches = await prisma.teamMatch.findMany({
    where: {
      trainingTeamKey: { in: keys },
      matchStart: {
        gte: startOfMonth(month),
        lte: endOfMonth(month),
      },
    },
    take: 1,
  });
  if (currentMonthMatches.length > 0) return month;

  const nextMatch = await prisma.teamMatch.findFirst({
    where: {
      trainingTeamKey: { in: keys },
      matchStart: { gte: startOfMonth(month) },
    },
    orderBy: { matchStart: "asc" },
  });

  if (nextMatch) {
    return startOfMonth(nextMatch.matchStart);
  }

  const previousMatch = await prisma.teamMatch.findFirst({
    where: {
      trainingTeamKey: { in: keys },
      matchStart: { lt: startOfMonth(month) },
    },
    orderBy: { matchStart: "desc" },
  });

  if (previousMatch) {
    return startOfMonth(previousMatch.matchStart);
  }

  return month;
}

export async function getMonthlyTeamMatches(
  trainingTeamKey: string,
  month: Date,
) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return prisma.teamMatch.findMany({
    where: {
      trainingTeamKey,
      matchStart: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { matchStart: "asc" },
  });
}

export async function getMonthlyMatchesForTeams(
  trainingTeamKeys: string[],
  month: Date,
) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return prisma.teamMatch.findMany({
    where: {
      trainingTeamKey: { in: trainingTeamKeys },
      matchStart: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { matchStart: "asc" },
  });
}

export async function getAllTeamMatches(trainingTeamKey: string) {
  return prisma.teamMatch.findMany({
    where: { trainingTeamKey },
    orderBy: { matchStart: "asc" },
  });
}

export async function getTeamMatchDetail(matchId: string, userId: string) {
  const { getMatchDetail } = await import("@/lib/match-attendance");
  return getMatchDetail(matchId, userId);
}

export async function getUpcomingTeamMatches(
  userId: string,
  trainingTeamKey: string,
  fromDate: Date = new Date(),
  daysAhead: number = TRAINING_RESPONSE_OPENS_DAYS,
  limit = 5,
) {
  const through = getResponseWindowEndDate(fromDate, daysAhead);

  const matches = await prisma.teamMatch.findMany({
    where: {
      trainingTeamKey,
      cancelled: false,
      matchStart: { gte: fromDate, lte: through },
    },
    orderBy: { matchStart: "asc" },
    take: limit,
  });

  const statuses = await getUserMatchAttendanceStatuses(
    userId,
    matches.map((match) => match.id),
  );

  return matches.map((match) => ({
    id: match.id,
    title: formatMatchTitle(match.opponentName, match.venue),
    startDate: match.matchStart.toISOString(),
    location: match.location,
    userStatus: statuses.get(match.id) ?? "UNANSWERED",
  }));
}
