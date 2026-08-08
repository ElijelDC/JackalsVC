import "server-only";

import { formatEventDateTime } from "@/lib/event-display";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { trialSessionPublicPath } from "@/lib/trial-session-types";

type TrialSessionReminderSession = {
  title: string;
  slug: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
};

function firstNameFrom(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || displayName;
}

export async function sendTrialSessionReminderEmail(input: {
  to: string;
  displayName: string;
  session: TrialSessionReminderSession;
}) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    input.session.startDate.toISOString(),
    input.session.endDate?.toISOString() ?? null,
    { timeZone: "club" },
  );

  const details = [
    { label: "Session", value: input.session.title },
    { label: "Date", value: dateLabel },
    { label: "Time", value: timeLabel },
  ];

  if (input.session.location) {
    details.push({ label: "Location", value: input.session.location });
  }

  return sendNotificationEmail({
    to: input.to,
    subject: `Reminder: ${input.session.title} is coming up`,
    content: {
      heading: "Session reminder",
      greeting: `Hi ${firstNameFrom(input.displayName)},`,
      paragraphs: [
        "This is a reminder that you're registered for a Jackals VC session.",
        "We look forward to seeing you on court.",
      ],
      details,
      ctaUrl: emailSiteUrl(trialSessionPublicPath(input.session.slug)),
      ctaLabel: "View session details",
    },
  });
}
