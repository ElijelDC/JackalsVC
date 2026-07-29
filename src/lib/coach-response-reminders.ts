import "server-only";

import type { CoachProfile } from "@/lib/coach-auth";
import {
  formatCoachSessionDate,
  getCoachReminderTargetItem,
} from "@/lib/coach-unanswered";
import type {
  CoachReminderStatus,
  CoachUnansweredItemKind,
} from "@/lib/coach-unanswered-config";
import { getCoachUnansweredItemUrl } from "@/lib/coach-unanswered-config";
import { prisma } from "@/lib/prisma";
import { sendTrainingResponseReminderEmail } from "@/lib/send-coach-reminder-email";
import { absoluteSiteUrl } from "@/lib/site-url";

export const COACH_RESPONSE_REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function getCoachReminderStatus(
  coachUserId: string,
  targetKind: CoachUnansweredItemKind,
  targetId: string,
  now: Date = new Date(),
): Promise<CoachReminderStatus> {
  const record = await prisma.coachResponseReminder.findUnique({
    where: {
      coachUserId_targetKind_targetId: {
        coachUserId,
        targetKind,
        targetId,
      },
    },
  });

  if (!record) {
    return { canSend: true, lastSentAt: null, nextAvailableAt: null };
  }

  const nextAvailableAt = new Date(
    record.lastSentAt.getTime() + COACH_RESPONSE_REMINDER_COOLDOWN_MS,
  );
  const canSend = nextAvailableAt.getTime() <= now.getTime();

  return {
    canSend,
    lastSentAt: record.lastSentAt.toISOString(),
    nextAvailableAt: canSend ? null : nextAvailableAt.toISOString(),
  };
}

async function recordCoachReminderSent(
  coachUserId: string,
  targetKind: CoachUnansweredItemKind,
  targetId: string,
  sentAt: Date = new Date(),
) {
  await prisma.coachResponseReminder.upsert({
    where: {
      coachUserId_targetKind_targetId: {
        coachUserId,
        targetKind,
        targetId,
      },
    },
    create: {
      coachUserId,
      targetKind,
      targetId,
      lastSentAt: sentAt,
    },
    update: {
      lastSentAt: sentAt,
    },
  });
}

export async function sendCoachUnansweredReminders(input: {
  coach: CoachProfile;
  kind: CoachUnansweredItemKind;
  id: string;
  siteUrl: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const cooldown = await getCoachReminderStatus(
    input.coach.userId,
    input.kind,
    input.id,
    now,
  );

  if (!cooldown.canSend) {
    return {
      ok: false as const,
      error: "Reminder was sent recently. Try again after the 24-hour cooldown.",
      cooldown,
    };
  }

  const item = await getCoachReminderTargetItem(
    input.coach.trainingTeamKeys,
    input.kind,
    input.id,
    now,
  );

  if (!item) {
    return {
      ok: false as const,
      error: "No unanswered players to remind for this session or match.",
      cooldown,
    };
  }

  const itemUrl = absoluteSiteUrl(
    input.siteUrl,
    getCoachUnansweredItemUrl(item),
  );
  const sessionLabel = formatCoachSessionDate(item.startDate);

  let delivered = 0;
  let logged = 0;

  for (const player of item.players) {
    const result = await sendTrainingResponseReminderEmail({
      email: player.email,
      playerName: player.name,
      coachName: input.coach.name,
      teamName: input.coach.teamName,
      sessionLabel,
      sessionUrl: itemUrl,
      kind: item.kind,
    });
    if (result.delivered) delivered += 1;
    else logged += 1;
  }

  await recordCoachReminderSent(input.coach.userId, input.kind, input.id, now);

  const nextCooldown = await getCoachReminderStatus(
    input.coach.userId,
    input.kind,
    input.id,
    now,
  );

  return {
    ok: true as const,
    notifiedCount: item.players.length,
    deliveredCount: delivered,
    loggedCount: logged,
    kind: item.kind,
    id: item.id,
    cooldown: nextCooldown,
  };
}
