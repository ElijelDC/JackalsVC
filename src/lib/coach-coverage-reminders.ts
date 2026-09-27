import "server-only";

import { formatInClubTime } from "@/lib/datetime-form";
import { requireMailTransporter } from "@/lib/email";
import { emailSiteUrl } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  listSquadCoaches,
  type SquadCoach,
} from "@/lib/coach-session-coverage";
import { COACH_RESPONSE_REMINDER_COOLDOWN_MS } from "@/lib/coach-response-reminders";
import type {
  CoachCoverageReminderPhase,
  CoachCoverageReminderPreview,
} from "@/lib/coach-coverage-reminders-config";
import { enrichEventRecords } from "@/lib/event-enrichment";
import { normalizeSignupStatus } from "@/lib/training-attendance-config";
import { userCanManageTrainingGuestInvites } from "@/lib/training-invites";

export type {
  CoachCoverageReminderPhase,
  CoachCoverageReminderPreview,
} from "@/lib/coach-coverage-reminders-config";

const COVERAGE_REMINDER_KIND = "coach-coverage";

async function getCoachSignupStatus(userId: string, eventId: string) {
  const signup = await prisma.eventSignup.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true },
  });
  if (!signup) return null;
  const status = normalizeSignupStatus(signup.status);
  if (status === "ATTENDING" || status === "NOT_ATTENDING") {
    return status;
  }
  return null;
}

async function getCoverageReminderCooldown(actorUserId: string, eventId: string) {
  const record = await prisma.coachResponseReminder.findUnique({
    where: {
      coachUserId_targetKind_targetId: {
        coachUserId: actorUserId,
        targetKind: COVERAGE_REMINDER_KIND,
        targetId: eventId,
      },
    },
    select: { lastSentAt: true },
  });
  const lastSentAt = record?.lastSentAt ?? null;
  if (!lastSentAt) {
    return {
      canSend: true,
      lastSentAt: null as string | null,
      nextAvailableAt: null as string | null,
    };
  }
  const next = new Date(
    lastSentAt.getTime() + COACH_RESPONSE_REMINDER_COOLDOWN_MS,
  );
  const canSend = Date.now() >= next.getTime();
  return {
    canSend,
    lastSentAt: lastSentAt.toISOString(),
    nextAvailableAt: canSend ? null : next.toISOString(),
  };
}

async function resolveCoverageTargets(input: {
  eventId: string;
  trainingTeamKey: string;
}): Promise<{
  phase: CoachCoverageReminderPhase;
  recipients: SquadCoach[];
  head: SquadCoach | null;
}> {
  const coaches = await listSquadCoaches(input.trainingTeamKey);
  const head = coaches.find((coach) => coach.isHeadCoach) ?? null;
  if (!head) {
    return { phase: "none_no_head", recipients: [], head: null };
  }

  const headStatus = await getCoachSignupStatus(head.userId, input.eventId);
  if (!headStatus) {
    return { phase: "head", recipients: [head], head };
  }
  if (headStatus === "ATTENDING") {
    return { phase: "none_head_accepted", recipients: [], head };
  }

  const covers = coaches.filter((coach) => !coach.isHeadCoach);
  const coverStatuses = await Promise.all(
    covers.map(async (coach) => ({
      coach,
      status: await getCoachSignupStatus(coach.userId, input.eventId),
    })),
  );

  if (coverStatuses.some((row) => row.status === "ATTENDING")) {
    return { phase: "none_cover_accepted", recipients: [], head };
  }

  const unansweredCovers = coverStatuses
    .filter((row) => !row.status)
    .map((row) => row.coach);

  if (unansweredCovers.length === 0) {
    return { phase: "none_all_set", recipients: [], head };
  }

  return { phase: "cover", recipients: unansweredCovers, head };
}

function previewCopy(
  phase: CoachCoverageReminderPhase,
  recipients: SquadCoach[],
  head: SquadCoach | null,
): Pick<CoachCoverageReminderPreview, "buttonLabel" | "description" | "canSend"> {
  switch (phase) {
    case "head":
      return {
        canSend: true,
        buttonLabel: "Remind head coach",
        description: `Ask ${head?.name ?? "the head coach"} to accept or decline this session first.`,
      };
    case "cover":
      return {
        canSend: true,
        buttonLabel:
          recipients.length === 1
            ? "Remind cover coach"
            : "Remind cover coaches",
        description: `${head?.name ?? "Head coach"} declined — nudge cover coaches who haven’t responded yet.`,
      };
    case "none_head_accepted":
      return {
        canSend: false,
        buttonLabel: "Head coach accepted",
        description: `${head?.name ?? "Head coach"} is covering — no reminder needed.`,
      };
    case "none_cover_accepted":
      return {
        canSend: false,
        buttonLabel: "Cover accepted",
        description: "A cover coach has already accepted this session.",
      };
    case "none_no_head":
      return {
        canSend: false,
        buttonLabel: "No head coach",
        description: "Assign a head coach for this squad before sending reminders.",
      };
    case "none_all_set":
    default:
      return {
        canSend: false,
        buttonLabel: "Coaches responded",
        description: "All cover coaches have already responded.",
      };
  }
}

export async function getCoachCoverageReminderPreview(input: {
  eventId: string;
  trainingTeamKey: string;
  actorUserId: string;
}): Promise<CoachCoverageReminderPreview> {
  const { phase, recipients, head } = await resolveCoverageTargets(input);
  const copy = previewCopy(phase, recipients, head);
  const cooldown = await getCoverageReminderCooldown(
    input.actorUserId,
    input.eventId,
  );
  return {
    phase,
    ...copy,
    canSend: copy.canSend && cooldown.canSend,
    recipientNames: recipients.map((coach) => coach.name),
    headCoachName: head?.name ?? null,
    cooldown,
  };
}

async function sendHeadCoachAcceptReminderEmail(input: {
  email: string;
  coachName: string;
  teamName: string;
  sessionLabel: string;
  sessionUrl: string;
  overseerName: string;
}) {
  const { transporter, from } = requireMailTransporter();
  const subject = `Please respond — ${input.teamName} training`;
  const text = [
    `Hi ${input.coachName},`,
    "",
    `${input.overseerName} asked you (head coach) to accept or decline this upcoming ${input.teamName} session:`,
    "",
    input.sessionLabel,
    "",
    "Please mark Attending or Can't make it here:",
    input.sessionUrl,
    "",
    "Cover coaches can only respond after you decline.",
    "",
    "Thanks,",
    "Jackals VC",
  ].join("\n");
  const html = [
    `<p>Hi ${input.coachName},</p>`,
    `<p><strong>${input.overseerName}</strong> asked you (head coach) to accept or decline this upcoming <strong>${input.teamName}</strong> session:</p>`,
    `<p>${input.sessionLabel}</p>`,
    `<p>Please mark <strong>Attending</strong> or <strong>Can't make it</strong> here:</p>`,
    `<p><a href="${input.sessionUrl}">Open session</a></p>`,
    `<p>Cover coaches can only respond after you decline.</p>`,
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

async function sendCoverCoachAcceptReminderEmail(input: {
  email: string;
  coachName: string;
  headCoachName: string;
  teamName: string;
  sessionLabel: string;
  sessionUrl: string;
  overseerName: string;
}) {
  const { transporter, from } = requireMailTransporter();
  const subject = `Cover needed — ${input.teamName} training`;
  const text = [
    `Hi ${input.coachName},`,
    "",
    `${input.overseerName} is following up: ${input.headCoachName} (head coach) can't cover this upcoming ${input.teamName} session:`,
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
    `<p><strong>${input.overseerName}</strong> is following up: <strong>${input.headCoachName}</strong> (head coach) can't cover this upcoming <strong>${input.teamName}</strong> session:</p>`,
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

export async function sendCoachCoverageReminders(input: {
  eventId: string;
  actorUserId: string;
}): Promise<
  | {
      ok: true;
      phase: "head" | "cover";
      notifiedCount: number;
      recipientNames: string[];
      preview: CoachCoverageReminderPreview;
    }
  | { ok: false; error: string; status: number }
> {
  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: {
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });
  if (!event || event.type !== "TRAINING") {
    return { ok: false, status: 404, error: "Training session not found." };
  }
  const [enriched] = await enrichEventRecords([event]);
  if (enriched?.occurrenceCancelled) {
    return {
      ok: false,
      status: 400,
      error: "This session is cancelled.",
    };
  }
  if (event.startDate.getTime() <= Date.now()) {
    return {
      ok: false,
      status: 400,
      error: "This session has already started.",
    };
  }
  const trainingTeamKey =
    event.trainingSession?.trainingTeamKey ??
    enriched?.trainingTeamKey ??
    null;
  if (!trainingTeamKey) {
    return {
      ok: false,
      status: 400,
      error: "This session is not linked to a squad.",
    };
  }

  const allowed = await userCanManageTrainingGuestInvites(
    input.actorUserId,
    trainingTeamKey,
  );
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: "Only squad overseers and admins can remind coaches.",
    };
  }

  const actor = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    select: { name: true },
  });
  const overseerName = actor?.name?.trim() || "Club overseer";

  const cooldown = await getCoverageReminderCooldown(
    input.actorUserId,
    input.eventId,
  );
  if (!cooldown.canSend) {
    return {
      ok: false,
      status: 400,
      error: "Reminder was sent recently. Try again after the 24-hour cooldown.",
    };
  }

  const { phase, recipients, head } = await resolveCoverageTargets({
    eventId: input.eventId,
    trainingTeamKey,
  });
  if (phase !== "head" && phase !== "cover") {
    const copy = previewCopy(phase, recipients, head);
    return { ok: false, status: 400, error: copy.description };
  }
  if (recipients.length === 0) {
    return { ok: false, status: 400, error: "No coaches to remind." };
  }

  const squad = await prisma.trainingSquad.findUnique({
    where: { key: trainingTeamKey },
    select: { name: true },
  });
  const teamName = squad?.name ?? trainingTeamKey;
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

  let notifiedCount = 0;
  for (const coach of recipients) {
    try {
      if (phase === "head") {
        await sendHeadCoachAcceptReminderEmail({
          email: coach.email,
          coachName: coach.name,
          teamName,
          sessionLabel,
          sessionUrl,
          overseerName,
        });
      } else {
        await sendCoverCoachAcceptReminderEmail({
          email: coach.email,
          coachName: coach.name,
          headCoachName: head?.name ?? "Head coach",
          teamName,
          sessionLabel,
          sessionUrl,
          overseerName,
        });
      }
      notifiedCount += 1;
    } catch (error) {
      console.error(
        "[coach-coverage-remind] failed to email",
        coach.email,
        error,
      );
    }
  }

  if (notifiedCount === 0) {
    return {
      ok: false,
      status: 500,
      error: "Could not send the reminder email. Please try again.",
    };
  }

  const now = new Date();
  await prisma.coachResponseReminder.upsert({
    where: {
      coachUserId_targetKind_targetId: {
        coachUserId: input.actorUserId,
        targetKind: COVERAGE_REMINDER_KIND,
        targetId: input.eventId,
      },
    },
    create: {
      coachUserId: input.actorUserId,
      targetKind: COVERAGE_REMINDER_KIND,
      targetId: input.eventId,
      lastSentAt: now,
    },
    update: { lastSentAt: now },
  });

  const preview = await getCoachCoverageReminderPreview({
    eventId: input.eventId,
    trainingTeamKey,
    actorUserId: input.actorUserId,
  });

  return {
    ok: true,
    phase,
    notifiedCount,
    recipientNames: recipients.map((coach) => coach.name),
    preview,
  };
}
