import "server-only";

import { notFound } from "next/navigation";
import {
  getResponseWindowEndDate,
  normalizeSignupStatus,
  resolveCoachAttendanceStatus,
  TRAINING_RESPONSE_OPENS_DAYS,
  type TrainingAttendanceStatus,
  type TrainingRosterMember,
  type TrainingSessionDetailData,
} from "@/lib/training-attendance-config";
import { getCoachResponseGate, listSquadCoaches } from "@/lib/coach-session-coverage";
import { getCoachReminderStatus } from "@/lib/coach-response-reminders";
import { enrichEventRecords, serializeEnrichedEvent } from "@/lib/event-enrichment";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";
import { getTeamTrainingSession, getUserTrainingTeamKeys, normalizeTrainingTeamKeys } from "@/lib/training-teams";

export type { TrainingRosterMember, TrainingSessionDetailData };

export async function getUserEventAttendanceStatuses(
  userId: string,
  eventIds: string[],
) {
  if (eventIds.length === 0) return new Map<string, TrainingAttendanceStatus>();

  const signups = await prisma.eventSignup.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true, status: true },
  });

  return new Map(
    signups.map((signup) => [
      signup.eventId,
      normalizeSignupStatus(signup.status),
    ]),
  );
}

export async function getAttendingEventIds(userId: string, eventIds: string[]) {
  const statuses = await getUserEventAttendanceStatuses(userId, eventIds);
  return new Set(
    [...statuses.entries()]
      .filter(([, status]) => status === "ATTENDING")
      .map(([eventId]) => eventId),
  );
}

export async function getUpcomingAttendingTrainingEvents(
  userId: string,
  trainingTeamKey: string,
  fromDate: Date = new Date(),
) {
  const session = await getTeamTrainingSession(trainingTeamKey);
  if (!session) return [];

  const signups = await prisma.eventSignup.findMany({
    where: {
      userId,
      status: { in: ["ATTENDING", "CONFIRMED"] },
      event: {
        type: "TRAINING",
        trainingSessionId: session.id,
        startDate: { gte: fromDate },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          type: true,
          location: true,
          trainingSessionId: true,
        },
      },
    },
    orderBy: { event: { startDate: "asc" } },
  });

  return signups.map((signup) => signup.event);
}

export async function getUpcomingTeamTrainingEvents(
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
      getUpcomingTeamTrainingEventsForKey(
        userId,
        key,
        fromDate,
        daysAhead,
        limit,
      ),
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

async function getUpcomingTeamTrainingEventsForKey(
  userId: string,
  trainingTeamKey: string,
  fromDate: Date = new Date(),
  daysAhead: number = TRAINING_RESPONSE_OPENS_DAYS,
  limit = 5,
) {
  const session = await getTeamTrainingSession(trainingTeamKey);
  if (!session) return [];

  const through = getResponseWindowEndDate(fromDate, daysAhead);

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      startDate: { gte: fromDate, lte: through },
    },
    orderBy: { startDate: "asc" },
    take: limit * 2,
  });

  const enriched = await enrichEventRecords(events);
  const activeEvents = enriched
    .filter((event) => !event.occurrenceCancelled)
    .slice(0, limit);

  const statuses = await getUserEventAttendanceStatuses(
    userId,
    activeEvents.map((event) => event.id),
  );
  const team = await getTrainingTeamByKey(trainingTeamKey);

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

  return activeEvents.map((event) => ({
    id: event.id,
    title: "Training",
    teamName: team?.name ?? null,
    teamKey: trainingTeamKey,
    startDate: event.startDate.toISOString(),
    location: event.location,
    userStatus: isCoach
      ? resolveCoachAttendanceStatus(
          statuses.get(event.id) ?? "UNANSWERED",
          event.startDate,
        )
      : (statuses.get(event.id) ?? "UNANSWERED"),
  }));
}

export async function getTrainingSessionDetail(
  eventId: string,
  userId: string,
): Promise<TrainingSessionDetailData> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      trainingSession: {
        select: {
          trainingTeamKey: true,
          coach: true,
          location: true,
          description: true,
        },
      },
    },
  });

  if (!event || event.type !== "TRAINING" || !event.trainingSession?.trainingTeamKey) {
    notFound();
  }

  const userTeamKeys = await getUserTrainingTeamKeys(userId);
  if (!userTeamKeys.includes(event.trainingSession.trainingTeamKey)) {
    notFound();
  }

  const team = await getTrainingTeamByKey(event.trainingSession.trainingTeamKey);
  if (!team) notFound();

  const [enriched] = await enrichEventRecords([event]);
  const serialized = serializeEnrichedEvent(enriched);
  const trainingTeamKey = event.trainingSession.trainingTeamKey;

  const [teammates, squadCoaches, signups] = await Promise.all([
    prisma.clubMember.findMany({
      where: {
        trainingTeamKey,
        active: true,
        userId: { not: null },
        rosterRole: { not: "COACH" },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    listSquadCoaches(trainingTeamKey),
    prisma.eventSignup.findMany({
      where: { eventId },
      select: { userId: true, status: true },
    }),
  ]);

  const signupMap = new Map(
    signups.map((signup) => [
      signup.userId,
      normalizeSignupStatus(signup.status),
    ]),
  );

  function groupByStatus(members: TrainingRosterMember[]) {
    return {
      attending: members.filter((m) => m.status === "ATTENDING"),
      notAttending: members.filter((m) => m.status === "NOT_ATTENDING"),
      unanswered: members.filter((m) => m.status === "UNANSWERED"),
    };
  }

  const sessionDate = new Date(serialized.startDate);

  const playerMembers: TrainingRosterMember[] = teammates
    .filter((member) => member.user)
    .map((member) => ({
      userId: member.userId!,
      name: member.user!.name,
      status: signupMap.get(member.userId!) ?? "UNANSWERED",
      isCurrentUser: member.userId === userId,
    }));

  const coachMembers: TrainingRosterMember[] = squadCoaches.map((coach) => {
    const rawStatus = signupMap.get(coach.userId) ?? "UNANSWERED";
    return {
      userId: coach.userId,
      name: coach.name,
      status: resolveCoachAttendanceStatus(rawStatus, sessionDate),
      isCurrentUser: coach.userId === userId,
      isHeadCoach: coach.isHeadCoach,
      coachPriority: coach.priority,
    };
  });

  const roster = groupByStatus(playerMembers);
  const coaches = groupByStatus(coachMembers);

  const isCoachUser = squadCoaches.some((coach) => coach.userId === userId);

  const rawUserStatus = signupMap.get(userId) ?? "UNANSWERED";
  const userStatus = isCoachUser
    ? resolveCoachAttendanceStatus(rawUserStatus, sessionDate)
    : rawUserStatus;

  const coachReminder =
    isCoachUser && roster.unanswered.length > 0
      ? await getCoachReminderStatus(userId, "training", eventId)
      : null;

  const coachResponseGate = isCoachUser
    ? await getCoachResponseGate({
        eventId,
        userId,
        trainingTeamKey,
      })
    : null;

  return {
    event: {
      id: serialized.id,
      title: serialized.title,
      description: serialized.sessionDescription ?? serialized.description,
      startDate: serialized.startDate,
      endDate: serialized.endDate,
      location: serialized.location,
      cancelled: enriched.occurrenceCancelled,
    },
    team,
    userStatus,
    isCoachUser,
    coachResponseGate,
    coachReminder,
    roster,
    coaches,
    counts: {
      attending: roster.attending.length,
      notAttending: roster.notAttending.length,
      unanswered: roster.unanswered.length,
      total: playerMembers.length,
    },
  };
}
