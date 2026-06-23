import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { jsonError, requireSession } from "@/lib/api";
import type { CoachPaymentType } from "@/lib/coach-payment-type";
import { isPaidCoachMember } from "@/lib/coach-payment-type";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";

export type CoachProfile = {
  userId: string;
  clubMemberId: string;
  name: string;
  trainingTeamKey: string;
  teamName: string;
  coachPaymentType: CoachPaymentType;
  isPaidCoach: boolean;
};

export async function getCoachProfile(
  userId: string | undefined,
): Promise<CoachProfile | null> {
  if (!userId) return null;

  const member = await prisma.clubMember.findFirst({
    where: {
      userId,
      rosterRole: "COACH",
      active: true,
      trainingTeamKey: { not: null },
    },
    select: {
      id: true,
      trainingTeamKey: true,
      name: true,
      coachPaymentType: true,
      user: { select: { name: true } },
    },
  });

  if (!member?.trainingTeamKey) return null;

  const team = await getTrainingTeamByKey(member.trainingTeamKey);
  const coachPaymentType = (member.coachPaymentType ?? "PAID") as CoachPaymentType;

  return {
    userId,
    clubMemberId: member.id,
    name: member.user?.name ?? member.name,
    trainingTeamKey: member.trainingTeamKey,
    teamName: team?.name ?? member.trainingTeamKey,
    coachPaymentType,
    isPaidCoach: isPaidCoachMember("COACH", coachPaymentType),
  };
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
