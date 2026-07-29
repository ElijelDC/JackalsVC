import "server-only";

import { notFound } from "next/navigation";
import {
  normalizeSignupStatus,
  resolveCoachAttendanceStatus,
  type TrainingAttendanceStatus,
  type TrainingRosterGroups,
  type TrainingRosterMember,
} from "@/lib/training-attendance-config";
import type { CoachReminderStatus } from "@/lib/coach-unanswered-config";
import { getCoachReminderStatus } from "@/lib/coach-response-reminders";
import { formatMatchTitle } from "@/lib/match-config";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";
import { getUserTrainingTeamKeys } from "@/lib/training-teams";

export type MatchDetailData = {
  match: {
    id: string;
    opponentName: string;
    venue: string;
    location: string;
    warmUpTime: string;
    matchStart: string;
    notes: string | null;
    title: string;
    cancelled: boolean;
  };
  team: {
    key: string;
    name: string;
    dayLabel: string;
  };
  userStatus: TrainingAttendanceStatus;
  isCoachUser: boolean;
  coachReminder: CoachReminderStatus | null;
  roster: TrainingRosterGroups;
  coaches: TrainingRosterGroups;
  counts: {
    attending: number;
    notAttending: number;
    unanswered: number;
    total: number;
  };
};

export async function getUserMatchAttendanceStatuses(
  userId: string,
  matchIds: string[],
) {
  if (matchIds.length === 0) return new Map<string, TrainingAttendanceStatus>();

  const signups = await prisma.matchSignup.findMany({
    where: { userId, matchId: { in: matchIds } },
    select: { matchId: true, status: true },
  });

  return new Map(
    signups.map((signup) => [
      signup.matchId,
      normalizeSignupStatus(signup.status),
    ]),
  );
}

export async function getMatchDetail(
  matchId: string,
  userId: string,
): Promise<MatchDetailData> {
  const match = await prisma.teamMatch.findUnique({ where: { id: matchId } });
  if (!match) notFound();

  const userTeamKeys = await getUserTrainingTeamKeys(userId);
  if (!userTeamKeys.includes(match.trainingTeamKey)) {
    notFound();
  }

  const team = await getTrainingTeamByKey(match.trainingTeamKey);
  if (!team) notFound();

  const teammates = await prisma.clubMember.findMany({
    where: {
      trainingTeamKey: match.trainingTeamKey,
      active: true,
      userId: { not: null },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const signups = await prisma.matchSignup.findMany({
    where: { matchId },
    select: { userId: true, status: true },
  });
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

  const linkedMembers = teammates
    .filter((member) => member.user)
    .map((member) => {
      const rawStatus = signupMap.get(member.userId!) ?? "UNANSWERED";
      const status =
        member.rosterRole === "COACH"
          ? resolveCoachAttendanceStatus(rawStatus, match.matchStart)
          : rawStatus;

      return {
        rosterRole: member.rosterRole,
        member: {
          userId: member.userId!,
          name: member.user!.name,
          status,
          isCurrentUser: member.userId === userId,
        } satisfies TrainingRosterMember,
      };
    });

  const playerMembers = linkedMembers
    .filter((entry) => entry.rosterRole !== "COACH")
    .map((entry) => entry.member);

  const coachMembers = linkedMembers
    .filter((entry) => entry.rosterRole === "COACH")
    .map((entry) => entry.member);

  const roster = groupByStatus(playerMembers);
  const coaches = groupByStatus(coachMembers);
  const isCoachUser =
    teammates.find((member) => member.userId === userId)?.rosterRole === "COACH";

  const rawUserStatus = signupMap.get(userId) ?? "UNANSWERED";
  const userStatus = isCoachUser
    ? resolveCoachAttendanceStatus(rawUserStatus, match.matchStart)
    : rawUserStatus;

  const coachReminder =
    isCoachUser && roster.unanswered.length > 0
      ? await getCoachReminderStatus(userId, "match", matchId)
      : null;

  return {
    match: {
      id: match.id,
      opponentName: match.opponentName,
      venue: match.venue,
      location: match.location,
      warmUpTime: match.warmUpTime.toISOString(),
      matchStart: match.matchStart.toISOString(),
      notes: match.notes,
      title: formatMatchTitle(match.opponentName, match.venue),
      cancelled: match.cancelled,
    },
    team,
    userStatus,
    isCoachUser,
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
