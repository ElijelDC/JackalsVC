import { formatInClubTime } from "@/lib/datetime-form";
import { requireMailTransporter } from "@/lib/email";
import { emailSiteUrl } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import type {
  CoachResponseGate,
  SquadCoach,
} from "@/lib/coach-session-coverage-config";

export type { CoachResponseGate, SquadCoach };

/** Lower priority number = higher rank. 0 is head coach. */
export async function listSquadCoaches(
  trainingTeamKey: string,
): Promise<SquadCoach[]> {
  const rows = await prisma.clubMemberCoachSquad.findMany({
    where: {
      trainingTeamKey,
      clubMember: {
        active: true,
        rosterRole: "COACH",
        userId: { not: null },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: {
      clubMember: {
        select: {
          id: true,
          name: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  const coaches: SquadCoach[] = [];

  for (const row of rows) {
    const userId = row.clubMember.userId;
    const email = row.clubMember.user?.email;
    if (!userId || !email) continue;
    coaches.push({
      clubMemberId: row.clubMember.id,
      userId,
      name: row.clubMember.name,
      email,
      priority: row.priority,
      isHeadCoach: row.priority === 0,
    });
  }

  return coaches;
}

export async function getHeadCoachForSquad(trainingTeamKey: string) {
  const coaches = await listSquadCoaches(trainingTeamKey);
  return coaches.find((coach) => coach.isHeadCoach) ?? null;
}

export async function findOtherAttendingCoaches(input: {
  eventId: string;
  excludeUserId: string;
  trainingTeamKey: string;
}) {
  const coaches = await listSquadCoaches(input.trainingTeamKey);
  const coachUserIds = coaches
    .map((coach) => coach.userId)
    .filter((id) => id !== input.excludeUserId);

  if (coachUserIds.length === 0) return [];

  return prisma.eventSignup.findMany({
    where: {
      eventId: input.eventId,
      status: "ATTENDING",
      userId: { in: coachUserIds },
    },
    select: {
      userId: true,
      user: { select: { name: true, email: true } },
    },
  });
}

async function getCoachSignupStatus(userId: string, eventId: string) {
  const signup = await prisma.eventSignup.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true },
  });
  if (signup?.status === "ATTENDING" || signup?.status === "NOT_ATTENDING") {
    return signup.status;
  }
  return null;
}

/** Null when the current user may respond. */
export async function getCoachResponseGate(input: {
  eventId: string;
  userId: string;
  trainingTeamKey: string;
}): Promise<CoachResponseGate | null> {
  const coaches = await listSquadCoaches(input.trainingTeamKey);
  const self = coaches.find((coach) => coach.userId === input.userId);
  if (!self || self.isHeadCoach) return null;

  const head = coaches.find((coach) => coach.isHeadCoach);
  if (!head) return null;

  const headStatus = await getCoachSignupStatus(head.userId, input.eventId);
  if (!headStatus) {
    return { kind: "waiting_for_head", headCoachName: head.name };
  }
  if (headStatus === "ATTENDING") {
    return { kind: "head_accepted", headCoachName: head.name };
  }

  // Head declined — cover coaches may respond.
  return null;
}

/**
 * Head coach responds first. Cover coaches may only reply after a head decline.
 * If the head accepted, cover is locked. Only one coach may be ATTENDING; head can reclaim.
 * Check + demotion run in one transaction with the signup upsert (caller must upsert after).
 */
export async function enforceExclusiveCoachAttendance(input: {
  eventId: string;
  userId: string;
  trainingTeamKey: string;
  status: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const coaches = await listSquadCoaches(input.trainingTeamKey);
  const self = coaches.find((coach) => coach.userId === input.userId);
  if (!self) return { ok: true };

  if (!self.isHeadCoach) {
    const head = coaches.find((coach) => coach.isHeadCoach);
    if (head) {
      const headStatus = await getCoachSignupStatus(head.userId, input.eventId);
      if (!headStatus) {
        return {
          ok: false,
          status: 403,
          error: `Waiting for ${head.name} (head coach) to respond first. Cover coaches can respond after they decline.`,
        };
      }
      if (headStatus === "ATTENDING") {
        return {
          ok: false,
          status: 403,
          error: `${head.name} (head coach) has accepted — no cover needed.`,
        };
      }
    }
  }

  if (input.status !== "ATTENDING") return { ok: true };

  // Serialize cover claims: re-check attending coaches inside a transaction and
  // demote others when the head reclaims, or reject if another cover already claimed.
  try {
    await prisma.$transaction(async (tx) => {
      const coachUserIds = coaches
        .map((coach) => coach.userId)
        .filter((id) => id !== input.userId);

      const others =
        coachUserIds.length === 0
          ? []
          : await tx.eventSignup.findMany({
              where: {
                eventId: input.eventId,
                status: "ATTENDING",
                userId: { in: coachUserIds },
              },
              select: {
                userId: true,
                user: { select: { name: true } },
              },
            });

      if (others.length === 0) return;

      if (self.isHeadCoach) {
        await tx.eventSignup.updateMany({
          where: {
            eventId: input.eventId,
            userId: { in: others.map((row) => row.userId) },
            status: "ATTENDING",
          },
          data: { status: "NOT_ATTENDING" },
        });
        return;
      }

      const names = others
        .map((row) => row.user.name)
        .filter(Boolean)
        .join(", ");
      throw Object.assign(
        new Error(
          names
            ? `${names} has already accepted this session. Only one coach can cover at a time.`
            : "Another coach has already accepted this session. Only one coach can cover at a time.",
        ),
        { statusCode: 409 },
      );
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode?: number }).statusCode === 409
    ) {
      return {
        ok: false,
        status: 409,
        error: error instanceof Error ? error.message : "Conflict",
      };
    }
    throw error;
  }

  return { ok: true };
}

export async function notifyCoverCoachesAfterHeadDecline(input: {
  eventId: string;
  headUserId: string;
  trainingTeamKey: string;
}) {
  const coaches = await listSquadCoaches(input.trainingTeamKey);
  const head = coaches.find((coach) => coach.userId === input.headUserId);
  if (!head?.isHeadCoach) return { notified: 0 };

  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: {
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });
  if (!event || event.type !== "TRAINING") return { notified: 0 };

  const coverCoaches = coaches.filter(
    (coach) => coach.userId !== input.headUserId,
  );
  if (coverCoaches.length === 0) return { notified: 0 };

  const squad = await prisma.trainingSquad.findUnique({
    where: { key: input.trainingTeamKey },
    select: { name: true },
  });
  const teamName = squad?.name ?? input.trainingTeamKey;
  const sessionLabel = [
    event.title,
    formatInClubTime(event.startDate, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
  ]
    .filter(Boolean)
    .join(" · ");

  const sessionUrl = emailSiteUrl(`/calendar/${event.id}`);
  let notified = 0;

  for (const coach of coverCoaches) {
    try {
      await sendCoachCoverRequestEmail({
        email: coach.email,
        coachName: coach.name,
        headCoachName: head.name,
        teamName,
        sessionLabel,
        sessionUrl,
      });
      notified += 1;
    } catch (error) {
      console.error(
        "[coach-cover] failed to notify",
        coach.email,
        error,
      );
    }
  }

  return { notified };
}

async function sendCoachCoverRequestEmail(input: {
  email: string;
  coachName: string;
  headCoachName: string;
  teamName: string;
  sessionLabel: string;
  sessionUrl: string;
}) {
  const { transporter, from } = requireMailTransporter();

  const subject = `Cover needed — ${input.teamName} training`;
  const text = [
    `Hi ${input.coachName},`,
    "",
    `${input.headCoachName} (head coach) can't cover this upcoming ${input.teamName} session:`,
    "",
    input.sessionLabel,
    "",
    "If you can cover, mark yourself as Attending here (only one coach can accept):",
    input.sessionUrl,
    "",
    "Thanks,",
    "Jackals VC",
  ].join("\n");

  const html = [
    `<p>Hi ${input.coachName},</p>`,
    `<p><strong>${input.headCoachName}</strong> (head coach) can't cover this upcoming <strong>${input.teamName}</strong> session:</p>`,
    `<p>${input.sessionLabel}</p>`,
    `<p>If you can cover, mark yourself as <strong>Attending</strong> here (only one coach can accept):</p>`,
    `<p><a href="${input.sessionUrl}">Open session</a></p>`,
    "<p>Thanks,<br>Jackals VC</p>",
  ].join("");

  await transporter.sendMail({
    from,
    to: input.email,
    subject,
    text,
    html,
  });
}
