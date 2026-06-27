import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 50;

function formatEventDate(start: Date, end: Date | null): string {
  const dateLabel = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!end) return `${dateLabel} · ${timeLabel}`;
  const endTime = end.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateLabel} · ${timeLabel}–${endTime}`;
}

export type EventNewsletterResult = {
  recipients: number;
  batches: number;
  delivered: number;
};

/**
 * Emails active members (who haven't opted out) about a newly created event.
 * Recipients are BCC'd in batches so addresses stay private. Never throws.
 */
export async function sendEventNewsletter(
  eventId: string,
): Promise<EventNewsletterResult> {
  const result: EventNewsletterResult = {
    recipients: 0,
    batches: 0,
    delivered: 0,
  };

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return result;

    const users = await prisma.user.findMany({
      where: {
        eventNewsletterOptOut: false,
        clubMember: { is: { active: true } },
      },
      select: { email: true },
    });

    const emails = users.map((user) => user.email).filter(Boolean);
    result.recipients = emails.length;
    if (emails.length === 0) return result;

    const details = [
      { label: "When", value: formatEventDate(event.startDate, event.endDate) },
    ];
    if (event.location) {
      details.push({ label: "Where", value: event.location });
    }

    const paragraphs = [`A new event has been added to the Jackals VC calendar:`];
    if (event.description) {
      paragraphs.push(event.description);
    }

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const { delivered } = await sendNotificationEmail({
        bcc: batch,
        subject: `New Jackals VC event: ${event.title}`,
        content: {
          heading: event.title,
          paragraphs,
          details,
          ctaUrl: emailSiteUrl("/events"),
          ctaLabel: "See event details",
          footnote:
            "You're receiving this because you're a Jackals VC member. Turn off event emails any time from your profile page.",
        },
      });
      result.batches += 1;
      if (delivered) result.delivered += batch.length;
    }
  } catch (error) {
    console.error("[notify] failed to send event newsletter", error);
  }

  return result;
}
