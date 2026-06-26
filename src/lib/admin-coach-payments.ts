import "server-only";

import { getCoachSalaryPayments } from "@/lib/coach-payments";
import type { AdminCoachPaymentRow } from "@/lib/coach-payments-config";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";

export type { AdminCoachPaymentRow };

export async function getAdminCoachPaymentRows(options?: {
  monthsBack?: number;
  monthsAhead?: number;
}): Promise<AdminCoachPaymentRow[]> {
  const monthsBack = options?.monthsBack ?? 6;
  const monthsAhead = options?.monthsAhead ?? 3;

  const coaches = await prisma.clubMember.findMany({
    where: {
      rosterRole: "COACH",
      active: true,
      trainingTeamKey: { not: null },
      OR: [{ coachPaymentType: "PAID" }, { coachPaymentType: null }],
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    coaches.map(async (coach) => {
      const team = coach.trainingTeamKey
        ? await getTrainingTeamByKey(coach.trainingTeamKey)
        : null;

      const payments = coach.trainingTeamKey
        ? await getCoachSalaryPayments(
            coach.id,
            coach.trainingTeamKey,
            coach.userId,
            { monthsBack, monthsAhead },
          )
        : [];

      return {
        clubMemberId: coach.id,
        name: coach.user?.name ?? coach.name,
        email: coach.user?.email ?? null,
        trainingTeamKey: coach.trainingTeamKey,
        teamName: team?.name ?? coach.trainingTeamKey,
        payments,
      };
    }),
  );
}
