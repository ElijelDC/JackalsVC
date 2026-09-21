import "server-only";

import { listSquadOverseers } from "@/lib/coach-session-coverage";
import { formatEventDateTime } from "@/lib/event-display";
import { afterSaveNotify } from "@/lib/offer-notify";
import {
  emailSiteUrl,
  notifyAdmins,
  sendNotificationEmail,
} from "@/lib/notify";
import { prisma } from "@/lib/prisma";

/** Email admins when a guest requests a one-off `/session/[slug]` spot. */
export async function notifyTrialSessionSignupPending(signupId: string) {
  await afterSaveNotify("trial-session-signup-pending", async () => {
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
            sessionFee: true,
          },
        },
        paymentProof: { select: { proofScreenshotUrl: true } },
      },
    });
    if (!signup || signup.status !== "PENDING") return;

    const { dateLabel, timeLabel } = formatEventDateTime(
      signup.trialSession.startDate.toISOString(),
      signup.trialSession.endDate?.toISOString() ?? null,
      { timeZone: "club" },
    );

    const details = [
      { label: "Guest", value: signup.displayName },
      { label: "Email", value: signup.email },
      { label: "Session", value: signup.trialSession.title },
      { label: "Date", value: dateLabel },
      { label: "Time", value: timeLabel },
    ];
    if (signup.trialSession.location) {
      details.push({ label: "Location", value: signup.trialSession.location });
    }
    if (signup.trialSession.sessionFee != null) {
      details.push({
        label: "Fee",
        value: `€${signup.trialSession.sessionFee}`,
      });
    }
    details.push({
      label: "Receipt",
      value: signup.paymentProof?.proofScreenshotUrl
        ? "Uploaded"
        : "Not uploaded",
    });

    await notifyAdmins({
      subject: `[Jackals VC] Session request — ${signup.displayName} · ${signup.trialSession.title}`,
      replyTo: signup.email,
      content: {
        heading: "New one-off session request",
        paragraphs: [
          `${signup.displayName} requested a spot for ${signup.trialSession.title} and is waiting for approval.`,
        ],
        details,
        imageUrl: signup.paymentProof?.proofScreenshotUrl
          ? emailSiteUrl(signup.paymentProof.proofScreenshotUrl)
          : undefined,
        imageAlt: "Payment receipt",
        ctaUrl: emailSiteUrl("/admin/one-off-sessions"),
        ctaLabel: "Review in admin",
      },
    });
  });
}

/**
 * Email squad overseers + admins when a guest registers via a training invite.
 * Head/cover coaches do not approve guests and are not notified.
 */
export async function notifyTrainingInviteSignupPending(signupId: string) {
  await afterSaveNotify("training-invite-signup-pending", async () => {
    const signup = await prisma.trainingInviteSignup.findUnique({
      where: { id: signupId },
      include: {
        invite: {
          select: {
            pricingType: true,
            sessionFeeEur: true,
            eventId: true,
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
                trainingSession: { select: { trainingTeamKey: true } },
              },
            },
          },
        },
        paymentProof: { select: { proofScreenshotUrl: true } },
      },
    });
    if (!signup || signup.status !== "PENDING") return;

    const event = signup.invite.event;
    const { dateLabel, timeLabel } = formatEventDateTime(
      event.startDate.toISOString(),
      event.endDate?.toISOString() ?? null,
      { timeZone: "club" },
    );

    const details = [
      { label: "Guest", value: signup.displayName },
      { label: "Email", value: signup.email },
      { label: "Session", value: event.title },
      { label: "Date", value: dateLabel },
      { label: "Time", value: timeLabel },
      {
        label: "Pricing",
        value: signup.invite.pricingType === "PAID" ? "Paid" : "Free",
      },
    ];
    if (
      signup.invite.pricingType === "PAID" &&
      signup.invite.sessionFeeEur != null
    ) {
      details.push({
        label: "Session fee",
        value: `€${signup.invite.sessionFeeEur}`,
      });
    }
    if (event.location) {
      details.push({ label: "Location", value: event.location });
    }
    details.push({
      label: "Receipt",
      value: signup.paymentProof?.proofScreenshotUrl
        ? "Uploaded"
        : "Not required / not uploaded",
    });

    const sessionPath = `/training/session/${event.id}`;
    const contentBase = {
      heading: "New training guest request",
      paragraphs: [
        `${signup.displayName} registered via a training invite for ${event.title} and is waiting for approval.`,
      ],
      details,
      imageUrl: signup.paymentProof?.proofScreenshotUrl
        ? emailSiteUrl(signup.paymentProof.proofScreenshotUrl)
        : undefined,
      imageAlt: "Payment receipt",
      ctaUrl: emailSiteUrl(sessionPath),
      ctaLabel: "Review guests",
    };

    const teamKey = event.trainingSession?.trainingTeamKey;
    const overseers = teamKey ? await listSquadOverseers(teamKey) : [];
    const overseerEmails = overseers
      .map((coach) => coach.email)
      .filter((email): email is string => Boolean(email));

    if (overseerEmails.length > 0) {
      await sendNotificationEmail({
        to: overseerEmails,
        subject: `[Jackals VC] Guest request — ${signup.displayName} · ${event.title}`,
        replyTo: signup.email,
        content: contentBase,
      });
    }

    await notifyAdmins({
      subject: `[Jackals VC] Training guest — ${signup.displayName} · ${event.title}`,
      replyTo: signup.email,
      content: {
        ...contentBase,
        ctaLabel: "Open training session",
      },
    });
  });
}
