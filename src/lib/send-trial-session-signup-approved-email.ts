import "server-only";

import { formatEventDateTime } from "@/lib/event-display";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { trialSessionPublicPath } from "@/lib/trial-session-types";

function firstNameFrom(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || displayName;
}

export async function sendTrialSessionSignupApprovedEmail(input: {
  to: string;
  displayName: string;
  session: {
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
  };
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
    subject: `You're in — ${input.session.title}`,
    content: {
      heading: "Request approved",
      greeting: `Hi ${firstNameFrom(input.displayName)},`,
      paragraphs: [
        `Your payment receipt has been verified and you're approved for ${input.session.title}.`,
        "You're on the attendee list — we look forward to seeing you on court.",
      ],
      details,
      ctaUrl: emailSiteUrl(trialSessionPublicPath(input.session.slug)),
      ctaLabel: "View session details",
      footnote: "Questions? Reply to this email.",
    },
  });
}

/** Emails an attendee after an admin approves their one-off session request. Never throws. */
export async function notifyTrialSessionSignupApproved(
  signupId: string,
): Promise<{ delivered: boolean }> {
  try {
    const signup = await prisma.trialSessionSignup.findUnique({
      where: { id: signupId },
      include: {
        trialSession: {
          select: {
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    if (!signup) return { delivered: false };

    return await sendTrialSessionSignupApprovedEmail({
      to: signup.email,
      displayName: signup.displayName,
      session: signup.trialSession,
    });
  } catch (error) {
    console.error(
      "[notify] failed to send trial session signup approved email",
      error,
    );
    return { delivered: false };
  }
}
