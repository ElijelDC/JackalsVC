import "server-only";

import { format } from "date-fns";
import { enrichEventRecords } from "@/lib/event-enrichment";
import { formatMatchTitle } from "@/lib/match-config";
import type {
  CoachUnansweredItem,
  CoachUnansweredItemKind,
  UnansweredPlayer,
} from "@/lib/coach-unanswered-config";
import {
  canRespondToTrainingSession,
  isWithinTrainingResponseWindow,
  normalizeSignupStatus,
} from "@/lib/training-attendance-config";
import { prisma } from "@/lib/prisma";
import { getCoachReminderStatus } from "@/lib/coach-response-reminders";
import { getTeamTrainingSession } from "@/lib/training-teams";

export type { CoachUnansweredItem, UnansweredPlayer } from "@/lib/coach-unanswered-config";
export { getCoachUnansweredItemUrl } from "@/lib/coach-unanswered-config";

/** @deprecated Use CoachUnansweredItem */
export type CoachUnansweredSession = CoachUnansweredItem & { eventId: string };

async function getSquadPlayers(trainingTeamKey: string) {
  return prisma.clubMember.findMany({
    where: {
      trainingTeamKey,
      active: true,
      rosterRole: "PLAYER",
      userId: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: "asc" },
  });
}

function getUnansweredPlayers(
  players: Awaited<ReturnType<typeof getSquadPlayers>>,
  signupMap: Map<string, string | undefined>,
): UnansweredPlayer[] {
  return players
    .filter((player) => player.user?.email)
    .filter(
      (player) =>
        normalizeSignupStatus(signupMap.get(player.userId!)) === "UNANSWERED",
    )
    .map((player) => ({
      userId: player.userId!,
      name: player.user!.name,
      email: player.user!.email,
    }));
}

async function getCoachUnansweredTrainingItems(
  trainingTeamKey: string,
  players: Awaited<ReturnType<typeof getSquadPlayers>>,
  now: Date,
): Promise<CoachUnansweredItem[]> {
  const session = await getTeamTrainingSession(trainingTeamKey);
  if (!session) return [];

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      startDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
    take: 8,
  });

  const eventIds = events
    .filter((e) => isWithinTrainingResponseWindow(e.startDate, now))
    .map((e) => e.id);

  if (eventIds.length === 0) return [];

  const allSignups = await prisma.eventSignup.findMany({
    where: { eventId: { in: eventIds } },
    select: { eventId: true, userId: true, status: true },
  });

  const signupsByEvent = new Map<string, Map<string, string | undefined>>();
  for (const signup of allSignups) {
    let map = signupsByEvent.get(signup.eventId);
    if (!map) {
      map = new Map();
      signupsByEvent.set(signup.eventId, map);
    }
    map.set(signup.userId, signup.status);
  }

  const items: CoachUnansweredItem[] = [];

  for (const event of events) {
    if (!isWithinTrainingResponseWindow(event.startDate, now)) continue;

    const signupMap = signupsByEvent.get(event.id) ?? new Map();
    const unansweredPlayers = getUnansweredPlayers(players, signupMap);

    if (unansweredPlayers.length === 0) continue;

    items.push({
      kind: "training",
      id: event.id,
      title: event.title,
      startDate: event.startDate.toISOString(),
      location: event.location,
      players: unansweredPlayers,
    });
  }

  return items;
}

async function getCoachUnansweredMatchItems(
  trainingTeamKey: string,
  players: Awaited<ReturnType<typeof getSquadPlayers>>,
  now: Date,
): Promise<CoachUnansweredItem[]> {
  const matches = await prisma.teamMatch.findMany({
    where: {
      trainingTeamKey,
      cancelled: false,
      matchStart: { gte: now },
    },
    orderBy: { matchStart: "asc" },
    take: 8,
  });

  const matchIds = matches
    .filter((m) => isWithinTrainingResponseWindow(m.matchStart, now))
    .map((m) => m.id);

  if (matchIds.length === 0) return [];

  const allSignups = await prisma.matchSignup.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true, userId: true, status: true },
  });

  const signupsByMatch = new Map<string, Map<string, string | undefined>>();
  for (const signup of allSignups) {
    let map = signupsByMatch.get(signup.matchId);
    if (!map) {
      map = new Map();
      signupsByMatch.set(signup.matchId, map);
    }
    map.set(signup.userId, signup.status);
  }

  const items: CoachUnansweredItem[] = [];

  for (const match of matches) {
    if (!isWithinTrainingResponseWindow(match.matchStart, now)) continue;

    const signupMap = signupsByMatch.get(match.id) ?? new Map();
    const unansweredPlayers = getUnansweredPlayers(players, signupMap);

    if (unansweredPlayers.length === 0) continue;

    items.push({
      kind: "match",
      id: match.id,
      title: formatMatchTitle(match.opponentName, match.venue),
      startDate: match.matchStart.toISOString(),
      location: match.location,
      players: unansweredPlayers,
    });
  }

  return items;
}

export async function getCoachUnansweredItems(
  trainingTeamKey: string,
  now: Date = new Date(),
): Promise<CoachUnansweredItem[]> {
  const players = await getSquadPlayers(trainingTeamKey);

  const [trainingItems, matchItems] = await Promise.all([
    getCoachUnansweredTrainingItems(trainingTeamKey, players, now),
    getCoachUnansweredMatchItems(trainingTeamKey, players, now),
  ]);

  return [...trainingItems, ...matchItems].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export async function getCoachUnansweredItemsWithReminders(
  trainingTeamKey: string,
  coachUserId: string,
  now: Date = new Date(),
) {
  const items = await getCoachUnansweredItems(trainingTeamKey, now);

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      reminder: await getCoachReminderStatus(
        coachUserId,
        item.kind,
        item.id,
        now,
      ),
    })),
  );
}

export async function getCoachUnansweredTrainingSession(
  trainingTeamKey: string,
  now: Date = new Date(),
): Promise<CoachUnansweredSession | null> {
  const items = await getCoachUnansweredItems(trainingTeamKey, now);
  const training = items.find((item) => item.kind === "training");
  if (!training) return null;

  return { ...training, eventId: training.id };
}

export function formatCoachSessionDate(isoDate: string) {
  return format(new Date(isoDate), "EEEE d MMMM yyyy 'at' HH:mm");
}

export async function getCoachReminderTargetItem(
  trainingTeamKey: string,
  kind: CoachUnansweredItemKind,
  id: string,
  now: Date = new Date(),
): Promise<CoachUnansweredItem | null> {
  const players = await getSquadPlayers(trainingTeamKey);

  if (kind === "training") {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        trainingSession: { select: { trainingTeamKey: true } },
      },
    });

    if (
      !event ||
      event.type !== "TRAINING" ||
      event.trainingSession?.trainingTeamKey !== trainingTeamKey ||
      event.startDate < now
    ) {
      return null;
    }

    const [enriched] = await enrichEventRecords([event]);
    if (enriched.occurrenceCancelled) return null;
    if (!canRespondToTrainingSession(event.startDate, now)) return null;

    const signups = await prisma.eventSignup.findMany({
      where: { eventId: event.id },
      select: { userId: true, status: true },
    });
    const signupMap = new Map(
      signups.map((signup) => [signup.userId, signup.status]),
    );
    const unansweredPlayers = getUnansweredPlayers(players, signupMap);
    if (unansweredPlayers.length === 0) return null;

    return {
      kind: "training",
      id: event.id,
      title: event.title,
      startDate: event.startDate.toISOString(),
      location: event.location,
      players: unansweredPlayers,
    };
  }

  const match = await prisma.teamMatch.findUnique({ where: { id } });
  if (
    !match ||
    match.trainingTeamKey !== trainingTeamKey ||
    match.cancelled ||
    match.matchStart < now ||
    !canRespondToTrainingSession(match.matchStart, now)
  ) {
    return null;
  }

  const signups = await prisma.matchSignup.findMany({
    where: { matchId: match.id },
    select: { userId: true, status: true },
  });
  const signupMap = new Map(
    signups.map((signup) => [signup.userId, signup.status]),
  );
  const unansweredPlayers = getUnansweredPlayers(players, signupMap);
  if (unansweredPlayers.length === 0) return null;

  return {
    kind: "match",
    id: match.id,
    title: formatMatchTitle(match.opponentName, match.venue),
    startDate: match.matchStart.toISOString(),
    location: match.location,
    players: unansweredPlayers,
  };
}
