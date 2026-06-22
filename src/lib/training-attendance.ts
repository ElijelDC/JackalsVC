import "server-only";

import { notFound } from "next/navigation";
import {
  getResponseWindowEndDate,
  normalizeSignupStatus,
  TRAINING_RESPONSE_OPENS_DAYS,
  type TrainingAttendanceStatus,
  type TrainingRosterMember,
  type TrainingSessionDetailData,
} from "@/lib/training-attendance-config";
import { enrichEventRecords, serializeEnrichedEvent } from "@/lib/event-enrichment";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-teams-config";
import { getTeamTrainingSession, getUserTrainingTeamKey } from "@/lib/training-teams";

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
    take: limit,
  });

  const statuses = await getUserEventAttendanceStatuses(
    userId,
    events.map((event) => event.id),
  );
  const team = getTrainingTeamByKey(trainingTeamKey);

  return events.map((event) => ({
    id: event.id,
    title: team ? `${team.name} training` : event.title,
    startDate: event.startDate.toISOString(),
    location: event.location,
    userStatus: statuses.get(event.id) ?? "UNANSWERED",
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

  const userTeamKey = await getUserTrainingTeamKey(userId);
  if (userTeamKey !== event.trainingSession.trainingTeamKey) {
    notFound();
  }

  const team = getTrainingTeamByKey(event.trainingSession.trainingTeamKey);
  if (!team) notFound();

  const [enriched] = await enrichEventRecords([event]);
  const serialized = serializeEnrichedEvent(enriched);

  const teammates = await prisma.clubMember.findMany({
    where: {
      trainingTeamKey: event.trainingSession.trainingTeamKey,
      active: true,
      userId: { not: null },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const signups = await prisma.eventSignup.findMany({
    where: { eventId },
    select: { userId: true, status: true },
  });
  const signupMap = new Map(
    signups.map((signup) => [
      signup.userId,
      normalizeSignupStatus(signup.status),
    ]),
  );

  const rosterMembers: TrainingRosterMember[] = teammates
    .filter((member) => member.user)
    .map((member) => ({
      userId: member.userId!,
      name: member.user!.name,
      status: signupMap.get(member.userId!) ?? "UNANSWERED",
      isCurrentUser: member.userId === userId,
    }));

  const attending = rosterMembers.filter((m) => m.status === "ATTENDING");
  const notAttending = rosterMembers.filter((m) => m.status === "NOT_ATTENDING");
  const unanswered = rosterMembers.filter((m) => m.status === "UNANSWERED");

  const userStatus = signupMap.get(userId) ?? "UNANSWERED";

  return {
    event: {
      id: serialized.id,
      title: serialized.title,
      description: serialized.sessionDescription ?? serialized.description,
      startDate: serialized.startDate,
      endDate: serialized.endDate,
      location: serialized.location,
      coach: serialized.coach,
    },
    team,
    userStatus,
    roster: { attending, notAttending, unanswered },
    counts: {
      attending: attending.length,
      notAttending: notAttending.length,
      unanswered: unanswered.length,
      total: rosterMembers.length,
    },
  };
}
