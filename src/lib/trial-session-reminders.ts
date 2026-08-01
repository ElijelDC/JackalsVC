import "server-only";

import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendTrialSessionReminderEmail } from "@/lib/send-trial-session-reminder-email";
import {
  TRIAL_SESSION_REMINDER_KIND,
  isWithinTrialSessionReminderWindow,
} from "@/lib/trial-session-reminder-window";

export type TrialSessionReminderStats = {
  windowOpen: boolean;
  sent: number;
  pending: number;
};

export type TrialSessionReminderRunResult = {
  scanned: number;
  attempted: number;
  delivered: number;
  skipped: number;
  failed: number;
};

export async function getTrialSessionReminderStats(
  sessionId: string,
  startDate: Date,
  now: Date = new Date(),
): Promise<TrialSessionReminderStats> {
  const signups = await prisma.trialSessionSignup.findMany({
    where: { trialSessionId: sessionId, status: "APPROVED" },
    select: {
      reminders: {
        where: { kind: TRIAL_SESSION_REMINDER_KIND },
        select: { id: true },
        take: 1,
      },
    },
  });

  const sent = signups.filter((signup) => signup.reminders.length > 0).length;

  return {
    windowOpen: isWithinTrialSessionReminderWindow(startDate, now),
    sent,
    pending: Math.max(0, signups.length - sent),
  };
}

export function deriveTrialSessionReminderStats(
  signups: { reminderSent: boolean }[],
  startDate: Date,
  now: Date = new Date(),
): TrialSessionReminderStats {
  const sent = signups.filter((signup) => signup.reminderSent).length;

  return {
    windowOpen: isWithinTrialSessionReminderWindow(startDate, now),
    sent,
    pending: Math.max(0, signups.length - sent),
  };
}

async function sendReminderToSignup(
  signup: { id: string; email: string; displayName: string },
  session: {
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
  },
): Promise<"delivered" | "failed" | "skipped"> {
  let reminderId: string | null = null;

  try {
    const reminder = await prisma.trialSessionReminder.create({
      data: { signupId: signup.id, kind: TRIAL_SESSION_REMINDER_KIND },
    });
    reminderId = reminder.id;
  } catch {
    return "skipped";
  }

  const { delivered } = await sendTrialSessionReminderEmail({
    to: signup.email,
    displayName: signup.displayName,
    session,
  });

  if (!delivered) {
    if (reminderId) {
      await prisma.trialSessionReminder
        .delete({ where: { id: reminderId } })
        .catch(() => undefined);
    }
    return "failed";
  }

  return "delivered";
}

export async function sendTrialSessionReminders(
  sessionId: string,
  options: { signupIds?: string[]; now?: Date } = {},
): Promise<TrialSessionReminderRunResult> {
  const now = options.now ?? new Date();
  const signupIdFilter =
    options.signupIds && options.signupIds.length > 0
      ? new Set(options.signupIds)
      : null;

  const session = await prisma.trialSession.findUnique({
    where: { id: sessionId },
    include: {
      signups: {
        ...(signupIdFilter
          ? { where: { id: { in: [...signupIdFilter] }, status: "APPROVED" } }
          : { where: { status: "APPROVED" } }),
        include: {
          reminders: {
            where: { kind: TRIAL_SESSION_REMINDER_KIND },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Trial session not found");
  }

  if (signupIdFilter && session.signups.length !== signupIdFilter.size) {
    throw new Error("One or more selected attendees were not found");
  }

  if (session.startDate <= now) {
    throw new Error("This session has already started");
  }

  if (!isWithinTrialSessionReminderWindow(session.startDate, now)) {
    throw new Error(
      "Reminders can only be sent within 24 hours of the session start",
    );
  }

  const result: TrialSessionReminderRunResult = {
    scanned: session.signups.length,
    attempted: 0,
    delivered: 0,
    skipped: 0,
    failed: 0,
  };

  for (const signup of session.signups) {
    if (signup.reminders.length > 0) {
      result.skipped += 1;
      continue;
    }

    result.attempted += 1;
    const outcome = await sendReminderToSignup(signup, session);

    if (outcome === "delivered") result.delivered += 1;
    else if (outcome === "failed") result.failed += 1;
    else result.skipped += 1;
  }

  return result;
}

export async function runTrialSessionDayBeforeReminders(
  now: Date = new Date(),
): Promise<TrialSessionReminderRunResult> {
  const sessions = await prisma.trialSession.findMany({
    where: {
      startDate: {
        gt: now,
        lte: addHours(now, 24),
      },
    },
    include: {
      signups: {
        where: { status: "APPROVED" },
        include: {
          reminders: {
            where: { kind: TRIAL_SESSION_REMINDER_KIND },
            select: { id: true },
          },
        },
      },
    },
  });

  const result: TrialSessionReminderRunResult = {
    scanned: 0,
    attempted: 0,
    delivered: 0,
    skipped: 0,
    failed: 0,
  };

  for (const session of sessions) {
    result.scanned += session.signups.length;

    for (const signup of session.signups) {
      if (signup.reminders.length > 0) {
        result.skipped += 1;
        continue;
      }

      result.attempted += 1;
      const outcome = await sendReminderToSignup(signup, session);

      if (outcome === "delivered") result.delivered += 1;
      else if (outcome === "failed") result.failed += 1;
      else result.skipped += 1;
    }
  }

  return result;
}
