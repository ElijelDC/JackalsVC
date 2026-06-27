import { addDays, differenceInCalendarDays } from "date-fns";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

const EUR = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

/** "DAY" = due tomorrow/today, "WEEK" = due within a week. */
export type DueReminderKind = "WEEK" | "DAY";

export type DueReminderRunResult = {
  scanned: number;
  weekSent: number;
  daySent: number;
  skipped: number;
  delivered: number;
};

/**
 * Sends "membership payment due" reminders:
 *   - WEEK reminder once, when a pending payment is 2–7 days from its due date.
 *   - DAY reminder once, when it is due today or tomorrow.
 *
 * Idempotent: each (payment, kind) reminder is recorded in MembershipDueReminder
 * so re-running (e.g. a daily cron) never double-sends.
 */
export async function runMembershipDueReminders(
  now: Date = new Date(),
): Promise<DueReminderRunResult> {
  const horizon = addDays(now, 7);

  const payments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      dueDate: { not: null, gte: now, lte: horizon },
    },
    include: {
      user: { select: { name: true, email: true } },
      dueReminders: { select: { kind: true } },
    },
  });

  const result: DueReminderRunResult = {
    scanned: payments.length,
    weekSent: 0,
    daySent: 0,
    skipped: 0,
    delivered: 0,
  };

  for (const payment of payments) {
    if (!payment.dueDate) {
      result.skipped += 1;
      continue;
    }

    const daysUntil = differenceInCalendarDays(payment.dueDate, now);
    if (daysUntil < 0 || daysUntil > 7) {
      result.skipped += 1;
      continue;
    }

    const kind: DueReminderKind = daysUntil <= 1 ? "DAY" : "WEEK";

    if (payment.dueReminders.some((reminder) => reminder.kind === kind)) {
      result.skipped += 1;
      continue;
    }

    const email = payment.user?.email;
    if (!email) {
      result.skipped += 1;
      continue;
    }

    // Reserve the reminder first so a concurrent run can't double-send.
    try {
      await prisma.membershipDueReminder.create({
        data: { paymentId: payment.id, kind },
      });
    } catch {
      // Unique constraint — already handled by another run.
      result.skipped += 1;
      continue;
    }

    const dueLabel = payment.dueDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const whenPhrase =
      kind === "DAY"
        ? daysUntil <= 0
          ? "is due today"
          : "is due tomorrow"
        : `is due in ${daysUntil} days`;

    const { delivered } = await sendNotificationEmail({
      to: email,
      subject:
        kind === "DAY"
          ? "Reminder: your Jackals VC membership payment is due"
          : "Heads up: your Jackals VC membership payment is coming up",
      content: {
        heading: "Membership payment reminder",
        greeting: `Hi ${payment.user?.name ?? "there"},`,
        paragraphs: [
          `Your membership payment ${whenPhrase}. You can pay by bank transfer and upload your screenshot from your payment page.`,
        ],
        details: [
          { label: "Amount", value: EUR.format(payment.amount) },
          { label: "Due date", value: dueLabel },
          { label: "Description", value: payment.description },
          { label: "Reference", value: payment.paymentReference },
        ],
        ctaUrl: emailSiteUrl("/membership"),
        ctaLabel: "View payment details",
      },
    });

    if (delivered) result.delivered += 1;
    if (kind === "DAY") result.daySent += 1;
    else result.weekSent += 1;
  }

  return result;
}
