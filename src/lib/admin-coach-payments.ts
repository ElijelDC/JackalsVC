import "server-only";

import {
  getCoachSalaryPaymentsWithCache,
  preloadTeamEvents,
} from "@/lib/coach-payments";
import type { AdminCoachPaymentRow } from "@/lib/coach-payments-config";
import { getClubMemberSquadKeys } from "@/lib/club-team-roster-sync";
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
        OR: [
          { trainingTeamKey: { not: null } },
          { coachSquads: { some: {} } },
        ],
        AND: [
          {
            OR: [{ coachPaymentType: "PAID" }, { coachPaymentType: null }],
          },
        ],
      },
      include: {
        user: { select: { name: true, email: true } },
        coachSquads: { select: { trainingTeamKey: true } },
      },
      orderBy: { name: "asc" },
    }),
    getTrainingSquads(),
  ]);

  const teamMap = new Map(squads.map((s) => [s.key, s.name]));

  const coachKeys = await Promise.all(
    coaches.map(async (coach) => ({
      coach,
      keys: await getClubMemberSquadKeys(coach.id),
    })),
  );

  const teamKeys = [
    ...new Set(coachKeys.flatMap(({ keys }) => keys)),
  ];

  const eventCache = await preloadTeamEvents(teamKeys, monthsBack, monthsAhead);

  return Promise.all(
    coachKeys.map(async ({ coach, keys }) => {
      const payments =
        keys.length > 0
          ? await getCoachSalaryPaymentsWithCache(
              coach.id,
              keys,
              coach.userId,
              { monthsBack, monthsAhead },
              eventCache,
            )
          : [];

      const teamNames = keys
        .map((key) => teamMap.get(key) ?? key)
        .filter(Boolean);

      return {
        clubMemberId: coach.id,
        name: coach.user?.name ?? coach.name,
        email: coach.user?.email ?? null,
        trainingTeamKey: keys[0] ?? coach.trainingTeamKey,
        trainingTeamKeys: keys,
        teamName:
          teamNames.length > 0
            ? teamNames.join(" · ")
            : (teamMap.get(coach.trainingTeamKey ?? "") ??
              coach.trainingTeamKey),
        payments,
      };
    }),
  );
}
