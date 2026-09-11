import "server-only";

import { endOfMonth, startOfMonth } from "date-fns";
import { getUserMatchAttendanceStatuses } from "@/lib/match-attendance";
import { formatMatchTitle } from "@/lib/match-config";
import { prisma } from "@/lib/prisma";
import { getScheduleMonthWindow } from "@/lib/schedule-month-groups";
import {
  getResponseWindowEndDate,
  resolveCoachAttendanceStatus,
  TRAINING_RESPONSE_OPENS_DAYS,
} from "@/lib/training-attendance-config";
import { parseTrainingMonthParam, normalizeTrainingTeamKeys } from "@/lib/training-teams";
import { getTrainingTeamByKey } from "@/lib/training-squads";

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
  const { rangeStart, rangeEnd } = getScheduleMonthWindow(month);

  return prisma.teamMatch.findMany({
    where: {
      trainingTeamKey,
      matchStart: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { matchStart: "asc" },
  });
}

export async function getMonthlyMatchesForTeams(
  trainingTeamKeys: string[],
  month: Date,
) {
  const { rangeStart, rangeEnd } = getScheduleMonthWindow(month);

  return prisma.teamMatch.findMany({
    where: {
      trainingTeamKey: { in: trainingTeamKeys },
      matchStart: { gte: rangeStart, lte: rangeEnd },
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

export async function getAllMatchesForTeams(trainingTeamKeys: string[]) {
  const keys = normalizeTrainingTeamKeys(trainingTeamKeys);
  if (keys.length === 0) return [];

  return prisma.teamMatch.findMany({
    where: { trainingTeamKey: { in: keys } },
    orderBy: { matchStart: "asc" },
    select: {
      id: true,
      trainingTeamKey: true,
      opponentName: true,
      venue: true,
      location: true,
      warmUpTime: true,
      matchStart: true,
      notes: true,
      cancelled: true,
    },
  });
}

/** Lightweight upcoming fixtures for dashboard preview (prioritises one squad). */
export async function getUpcomingFixturesPreview(
  trainingTeamKeys: string[],
  options?: {
    fromDate?: Date;
    limit?: number;
    preferTeamKey?: string | null;
  },
) {
  const keys = normalizeTrainingTeamKeys(trainingTeamKeys);
  if (keys.length === 0) return [];

  const fromDate = options?.fromDate ?? new Date();
  const limit = options?.limit ?? 4;
  const preferTeamKey = options?.preferTeamKey ?? null;

  const matches = await prisma.teamMatch.findMany({
    where: {
      trainingTeamKey: { in: keys },
      cancelled: false,
      matchStart: { gte: fromDate },
    },
    orderBy: { matchStart: "asc" },
    take: preferTeamKey ? Math.max(limit * 4, 12) : limit,
    select: {
      id: true,
      opponentName: true,
      venue: true,
      location: true,
      matchStart: true,
      trainingTeamKey: true,
    },
  });

  if (!preferTeamKey) return matches.slice(0, limit);

  return [...matches]
    .sort((a, b) => {
      const aMine = a.trainingTeamKey === preferTeamKey ? 0 : 1;
      const bMine = b.trainingTeamKey === preferTeamKey ? 0 : 1;
      if (aMine !== bMine) return aMine - bMine;
      return a.matchStart.getTime() - b.matchStart.getTime();
    })
    .slice(0, limit);
}

export async function getTeamMatchDetail(matchId: string, userId: string) {
  const { getMatchDetail } = await import("@/lib/match-attendance");
  return getMatchDetail(matchId, userId);
}

export async function getUpcomingTeamMatches(
  userId: string,
  trainingTeamKey: string | string[],
  fromDate: Date = new Date(),
  daysAhead: number = TRAINING_RESPONSE_OPENS_DAYS,
  limit = 5,
) {
  const keys = normalizeTrainingTeamKeys(trainingTeamKey);
  if (keys.length === 0) return [];

  const perTeam = await Promise.all(
    keys.map((key) =>
      getUpcomingTeamMatchesForKey(userId, key, fromDate, daysAhead, limit),
    ),
  );

  const merged = perTeam
    .flat()
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  return merged.slice(0, limit);
}

async function getUpcomingTeamMatchesForKey(
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

  const isCoach = Boolean(
    await prisma.clubMember.findFirst({
      where: {
        userId,
        trainingTeamKey,
        rosterRole: "COACH",
        active: true,
      },
      select: { id: true },
    }),
  );

  const team = await getTrainingTeamByKey(trainingTeamKey);

  return matches.map((match) => {
    const matchTitle = formatMatchTitle(match.opponentName, match.venue);
    return {
      id: match.id,
      title: matchTitle,
      teamName: team?.name ?? null,
      teamKey: trainingTeamKey,
      startDate: match.matchStart.toISOString(),
      location: match.location,
      venue: match.venue,
      userStatus: isCoach
        ? resolveCoachAttendanceStatus(
            statuses.get(match.id) ?? "UNANSWERED",
            match.matchStart,
          )
        : (statuses.get(match.id) ?? "UNANSWERED"),
    };
  });
}
