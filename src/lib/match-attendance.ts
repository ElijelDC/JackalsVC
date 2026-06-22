import "server-only";

import { notFound } from "next/navigation";
import {
  normalizeSignupStatus,
  type TrainingAttendanceStatus,
  type TrainingRosterMember,
} from "@/lib/training-attendance-config";
import { formatMatchTitle } from "@/lib/match-config";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";
import { getUserTrainingTeamKey } from "@/lib/training-teams";

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
  };
  team: {
    key: string;
    name: string;
    dayLabel: string;
  };
  userStatus: TrainingAttendanceStatus;
  roster: {
    attending: TrainingRosterMember[];
    notAttending: TrainingRosterMember[];
    unanswered: TrainingRosterMember[];
  };
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

  const userTeamKey = await getUserTrainingTeamKey(userId);
  if (!userTeamKey || userTeamKey !== match.trainingTeamKey) {
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
    },
    team,
    userStatus: signupMap.get(userId) ?? "UNANSWERED",
    roster: { attending, notAttending, unanswered },
    counts: {
      attending: attending.length,
      notAttending: notAttending.length,
      unanswered: unanswered.length,
      total: rosterMembers.length,
    },
  };
}
