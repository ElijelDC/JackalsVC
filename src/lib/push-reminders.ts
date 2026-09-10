import "server-only";

import { addHours, differenceInCalendarDays } from "date-fns";
import { formatMatchTitle } from "@/lib/match-config";
import { prisma } from "@/lib/prisma";
import { absoluteSiteUrl } from "@/lib/site-url";
import { getProductionSiteUrl } from "@/lib/site-config";
import { isWebPushConfigured, sendPushToUser } from "@/lib/web-push";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    getProductionSiteUrl()
  );
}

export type PushReminderRunResult = {
  scannedEvents: number;
  scannedMatches: number;
  sent: number;
  skipped: number;
  delivered: number;
};

async function reservePushReminder(input: {
  userId: string;
  targetKind: string;
  targetId: string;
  kind: string;
}) {
  try {
    await prisma.pushReminderSent.create({ data: input });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends day-before push reminders for:
 *   - Training/club events the member opted into (EventReminder)
 *   - Matches the member marked ATTENDING
 */
export async function runPushReminders(
  now: Date = new Date(),
): Promise<PushReminderRunResult> {
  const result: PushReminderRunResult = {
    scannedEvents: 0,
    scannedMatches: 0,
    sent: 0,
    skipped: 0,
    delivered: 0,
  };

  if (!isWebPushConfigured()) {
    return result;
  }

  const horizon = addHours(now, 36);

  const eventReminders = await prisma.eventReminder.findMany({
    where: {
      event: {
        startDate: { gte: now, lte: horizon },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          type: true,
        },
      },
    },
  });
  result.scannedEvents = eventReminders.length;

  for (const reminder of eventReminders) {
    const daysUntil = differenceInCalendarDays(reminder.event.startDate, now);
    if (daysUntil < 0 || daysUntil > 1) {
      result.skipped += 1;
      continue;
    }

    const kind = daysUntil <= 0 ? "DAY" : "EVE";
    const reserved = await reservePushReminder({
      userId: reminder.userId,
      targetKind: "EVENT",
      targetId: reminder.eventId,
      kind,
    });
    if (!reserved) {
      result.skipped += 1;
      continue;
    }

    const when =
      kind === "DAY" ? "today" : "tomorrow";
    const timeLabel = reminder.event.startDate.toLocaleTimeString("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/Dublin",
    });
    const location = reminder.event.location
      ? ` · ${reminder.event.location}`
      : "";

    result.sent += 1;
    const push = await sendPushToUser(reminder.userId, {
      title:
        reminder.event.type === "TRAINING"
          ? `Training ${when}`
          : `Event ${when}`,
      body: `${reminder.event.title} at ${timeLabel}${location}`,
      url: absoluteSiteUrl(siteUrl(), `/calendar/${reminder.event.id}`),
    });
    result.delivered += push.delivered;
  }

  const matchSignups = await prisma.matchSignup.findMany({
    where: {
      status: "ATTENDING",
      match: {
        cancelled: false,
        matchStart: { gte: now, lte: horizon },
      },
    },
    include: {
      match: {
        select: {
          id: true,
          opponentName: true,
          venue: true,
          location: true,
          matchStart: true,
        },
      },
    },
  });
  result.scannedMatches = matchSignups.length;

  for (const signup of matchSignups) {
    const daysUntil = differenceInCalendarDays(signup.match.matchStart, now);
    if (daysUntil < 0 || daysUntil > 1) {
      result.skipped += 1;
      continue;
    }

    const kind = daysUntil <= 0 ? "DAY" : "EVE";
    const reserved = await reservePushReminder({
      userId: signup.userId,
      targetKind: "MATCH",
      targetId: signup.match.id,
      kind,
    });
    if (!reserved) {
      result.skipped += 1;
      continue;
    }

    const when = kind === "DAY" ? "today" : "tomorrow";
    const timeLabel = signup.match.matchStart.toLocaleTimeString("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/Dublin",
    });

    result.sent += 1;
    const push = await sendPushToUser(signup.userId, {
      title: `Match ${when}`,
      body: `${formatMatchTitle(signup.match.opponentName, signup.match.venue)} at ${timeLabel} · ${signup.match.location}`,
      url: absoluteSiteUrl(siteUrl(), `/matches/${signup.match.id}`),
    });
    result.delivered += push.delivered;
  }

  return result;
}
