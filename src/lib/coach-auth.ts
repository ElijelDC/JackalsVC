import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { jsonError, requireSession } from "@/lib/api";
import type { CoachPaymentType } from "@/lib/coach-payment-type";
import { isPaidCoachMember } from "@/lib/coach-payment-type";
import { prisma } from "@/lib/prisma";
import { getTrainingSquads, getTrainingTeamByKey } from "@/lib/training-squads";

export type CoachTeamOption = {
  key: string;
  name: string;
};

export type CoachProfile = {
  userId: string;
  clubMemberId: string;
  name: string;
  /** Primary / default squad (first assigned). */
  trainingTeamKey: string;
  teamName: string;
  trainingTeamKeys: string[];
  teams: CoachTeamOption[];
  coachPaymentType: CoachPaymentType;
  isPaidCoach: boolean;
};

export type CoachTeamFilter = {
  mode: "all" | "one";
  keys: string[];
  selectedKey: string | null;
  label: string;
};

function uniqueKeys(keys: Array<string | null | undefined>): string[] {
  return [...new Set(keys.filter((key): key is string => Boolean(key)))];
}

export async function resolveCoachSquadKeys(member: {
  trainingTeamKey: string | null;
  coachSquads?: Array<{ trainingTeamKey: string }>;
}): Promise<string[]> {
  const fromJoin = member.coachSquads?.map((row) => row.trainingTeamKey) ?? [];
  const keys = uniqueKeys([...fromJoin, member.trainingTeamKey]);
  if (keys.length === 0) return [];

  const squads = await getTrainingSquads();
  const order = new Map(squads.map((squad, index) => [squad.key, index]));
  return keys.sort(
    (a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999),
  );
}

export async function getCoachProfile(
  userId: string | undefined,
): Promise<CoachProfile | null> {
  if (!userId) return null;

  const member = await prisma.clubMember.findFirst({
    where: {
      userId,
      rosterRole: "COACH",
      active: true,
    },
    select: {
      id: true,
      trainingTeamKey: true,
      name: true,
      coachPaymentType: true,
      user: { select: { name: true } },
      coachSquads: { select: { trainingTeamKey: true } },
    },
  });

  if (!member) return null;

  const trainingTeamKeys = await resolveCoachSquadKeys(member);
  if (trainingTeamKeys.length === 0) return null;

  const primaryKey =
    (member.trainingTeamKey &&
      trainingTeamKeys.includes(member.trainingTeamKey) &&
      member.trainingTeamKey) ||
    trainingTeamKeys[0]!;

  const teams: CoachTeamOption[] = [];
  for (const key of trainingTeamKeys) {
    const team = await getTrainingTeamByKey(key);
    teams.push({ key, name: team?.name ?? key });
  }

  const primaryTeam = teams.find((team) => team.key === primaryKey) ?? teams[0]!;
  const coachPaymentType = (member.coachPaymentType ?? "PAID") as CoachPaymentType;

  return {
    userId,
    clubMemberId: member.id,
    name: member.user?.name ?? member.name,
    trainingTeamKey: primaryKey,
    teamName: primaryTeam.name,
    trainingTeamKeys,
    teams,
    coachPaymentType,
    isPaidCoach: isPaidCoachMember("COACH", coachPaymentType),
  };
}

export function resolveCoachTeamFilter(
  coach: CoachProfile,
  teamParam: string | null | undefined,
): CoachTeamFilter {
  const raw = teamParam?.trim() ?? "";
  const wantsAll = raw === "" || raw.toLowerCase() === "all";

  if (coach.trainingTeamKeys.length <= 1) {
    const key = coach.trainingTeamKeys[0] ?? coach.trainingTeamKey;
    const team = coach.teams.find((item) => item.key === key);
    return {
      mode: "one",
      keys: [key],
      selectedKey: key,
      label: team?.name ?? coach.teamName,
    };
  }

  if (!wantsAll && coach.trainingTeamKeys.includes(raw)) {
    const team = coach.teams.find((item) => item.key === raw);
    return {
      mode: "one",
      keys: [raw],
      selectedKey: raw,
      label: team?.name ?? raw,
    };
  }

  return {
    mode: "all",
    keys: coach.trainingTeamKeys,
    selectedKey: null,
    label: "All teams",
  };
}

/** Concrete team required for mutating schedule/matches. */
export function resolveCoachWriteTeamKey(
  coach: CoachProfile,
  teamParam: string | null | undefined,
): string {
  const filter = resolveCoachTeamFilter(coach, teamParam);
  if (filter.mode === "one" && filter.selectedKey) {
    return filter.selectedKey;
  }
  return coach.trainingTeamKey;
}

export function coachOwnsTeam(coach: CoachProfile, trainingTeamKey: string) {
  return coach.trainingTeamKeys.includes(trainingTeamKey);
}

export async function requireCoachPage(callbackUrl = "/dashboard") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const coach = await getCoachProfile(session.user.id);
  if (!coach) {
    redirect("/dashboard");
  }

  return { session, coach };
}

export async function requirePaidCoachPage(callbackUrl = "/payments") {
  const { session, coach } = await requireCoachPage(callbackUrl);

  if (!coach.isPaidCoach) {
    redirect("/dashboard");
  }

  return { session, coach };
}

export async function requireCoach() {
  const { session, response } = await requireSession();
  if (response) return { coach: null, session: null, response };

  const coach = await getCoachProfile(session!.user.id);
  if (!coach) {
    return {
      coach: null,
      session: null,
      response: jsonError("Forbidden", 403),
    };
  }

  return { coach, session, response: null };
}

export async function requirePaidCoach() {
  const result = await requireCoach();
  if (result.response || !result.coach) return result;

  if (!result.coach.isPaidCoach) {
    return {
      coach: null,
      session: null,
      response: jsonError("Forbidden", 403),
    };
  }

  return result;
}
