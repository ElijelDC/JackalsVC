import "server-only";

import {
  getCoachSalaryPaymentsWithCache,
  preloadTeamEvents,
} from "@/lib/coach-payments";
import type { AdminCoachPaymentRow } from "@/lib/coach-payments-config";
import { prisma } from "@/lib/prisma";
import { getTrainingSquads } from "@/lib/training-squads";

export type { AdminCoachPaymentRow };

export async function getAdminCoachPaymentRows(options?: {
  monthsBack?: number;
  monthsAhead?: number;
}): Promise<AdminCoachPaymentRow[]> {
  const monthsBack = options?.monthsBack ?? 6;
  const monthsAhead = options?.monthsAhead ?? 3;

  const [coaches, squads] = await Promise.all([
    prisma.clubMember.findMany({
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
    }),
    getTrainingSquads(),
  ]);

  const teamMap = new Map(squads.map((s) => [s.key, s.name]));

  const teamKeys = [
    ...new Set(
      coaches
        .map((c) => c.trainingTeamKey)
        .filter((k): k is string => k != null),
    ),
  ];

  const eventCache = await preloadTeamEvents(teamKeys, monthsBack, monthsAhead);

  return Promise.all(
    coaches.map(async (coach) => {
      const payments = coach.trainingTeamKey
        ? await getCoachSalaryPaymentsWithCache(
            coach.id,
            coach.trainingTeamKey,
            coach.userId,
            { monthsBack, monthsAhead },
            eventCache,
          )
        : [];

      return {
        clubMemberId: coach.id,
        name: coach.user?.name ?? coach.name,
        email: coach.user?.email ?? null,
        trainingTeamKey: coach.trainingTeamKey,
        teamName: teamMap.get(coach.trainingTeamKey ?? "") ?? coach.trainingTeamKey,
        payments,
      };
    }),
  );
}
