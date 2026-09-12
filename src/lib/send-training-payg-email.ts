import "server-only";

import { formatEventDateTime } from "@/lib/event-display";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

function firstNameFrom(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || displayName;
}

export async function sendTrainingPaygApprovedEmail(input: {
  to: string;
  displayName: string;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
  };
}) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    input.event.startDate.toISOString(),
    input.event.endDate?.toISOString() ?? null,
    { timeZone: "club" },
  );

  const details = [
    { label: "Session", value: input.event.title },
    { label: "Date", value: dateLabel },
    { label: "Time", value: timeLabel },
  ];

  if (input.event.location) {
    details.push({ label: "Location", value: input.event.location });
  }

  return sendNotificationEmail({
    to: input.to,
    subject: `You're in — ${input.event.title}`,
    content: {
      heading: "Training spot confirmed",
      greeting: `Hi ${firstNameFrom(input.displayName)},`,
      paragraphs: [
        `Your Pay Per Training receipt has been verified and you're marked attending for ${input.event.title}.`,
        "You're on the squad list — we look forward to seeing you at training.",
      ],
      details,
      ctaUrl: emailSiteUrl(`/training/session/${input.event.id}`),
      ctaLabel: "View training session",
      footnote: "Questions? Reply to this email.",
    },
  });
}

export async function notifyTrainingPaygApproved(
  attendanceId: string,
): Promise<{ delivered: boolean }> {
  try {
    const attendance = await prisma.trainingPaygAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        clubMember: {
          select: {
            name: true,
            registrationContactEmail: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!attendance) return { delivered: false };

    const event = await prisma.event.findUnique({
      where: { id: attendance.eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        location: true,
      },
    });
    if (!event) return { delivered: false };

    const to =
      attendance.clubMember.user?.email ??
      attendance.clubMember.registrationContactEmail ??
      null;
    if (!to) return { delivered: false };

    return await sendTrainingPaygApprovedEmail({
      to,
      displayName:
        attendance.clubMember.name ||
        attendance.clubMember.user?.name ||
        "there",
      event,
    });
  } catch (error) {
    console.error(
      "[notify] failed to send training PAYG approved email",
      error,
    );
    return { delivered: false };
  }
}

export async function sendTrainingPaygRejectedEmail(input: {
  to: string;
  displayName: string;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date | null;
  };
}) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    input.event.startDate.toISOString(),
    input.event.endDate?.toISOString() ?? null,
    { timeZone: "club" },
  );

  return sendNotificationEmail({
    to: input.to,
    subject: `Receipt not accepted — ${input.event.title}`,
    content: {
      heading: "Receipt needs another look",
      greeting: `Hi ${firstNameFrom(input.displayName)},`,
      paragraphs: [
        `We couldn't verify your Pay Per Training payment for ${input.event.title}.`,
        "Please check the amount and payment reference, then upload a clearer receipt screenshot from the training session page.",
      ],
      details: [
        { label: "Session", value: input.event.title },
        { label: "Date", value: dateLabel },
        { label: "Time", value: timeLabel },
      ],
      ctaUrl: emailSiteUrl(`/training/session/${input.event.id}`),
      ctaLabel: "Re-upload receipt",
      footnote: "Questions? Reply to this email.",
    },
  });
}

export async function notifyTrainingPaygRejected(
  attendanceId: string,
): Promise<{ delivered: boolean }> {
  try {
    const attendance = await prisma.trainingPaygAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        clubMember: {
          select: {
            name: true,
            registrationContactEmail: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!attendance) return { delivered: false };

    const event = await prisma.event.findUnique({
      where: { id: attendance.eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });
    if (!event) return { delivered: false };

    const to =
      attendance.clubMember.user?.email ??
      attendance.clubMember.registrationContactEmail ??
      null;
    if (!to) return { delivered: false };

    return await sendTrainingPaygRejectedEmail({
      to,
      displayName:
        attendance.clubMember.name ||
        attendance.clubMember.user?.name ||
        "there",
      event,
    });
  } catch (error) {
    console.error(
      "[notify] failed to send training PAYG rejected email",
      error,
    );
    return { delivered: false };
  }
}

export async function sendTrainingPaygMovedToWaitingEmail(input: {
  to: string;
  displayName: string;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date | null;
  };
  hasReceipt: boolean;
}) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    input.event.startDate.toISOString(),
    input.event.endDate?.toISOString() ?? null,
    { timeZone: "club" },
  );

  return sendNotificationEmail({
    to: input.to,
    subject: `Approval reversed — ${input.event.title}`,
    content: {
      heading: "Moved back to waiting",
      greeting: `Hi ${firstNameFrom(input.displayName)},`,
      paragraphs: [
        `Your Pay Per Training approval for ${input.event.title} was reversed, so you're back on the waiting list.`,
        input.hasReceipt
          ? "Your receipt is still on file and will be reviewed again shortly. You're not marked attending until approval is confirmed."
          : "Please upload your payment receipt from the training session page so we can approve you for the session.",
      ],
      details: [
        { label: "Session", value: input.event.title },
        { label: "Date", value: dateLabel },
        { label: "Time", value: timeLabel },
      ],
      ctaUrl: emailSiteUrl(`/training/session/${input.event.id}`),
      ctaLabel: input.hasReceipt ? "View training session" : "Upload receipt",
      footnote: "Questions? Reply to this email.",
    },
  });
}

export async function notifyTrainingPaygMovedToWaiting(
  attendanceId: string,
): Promise<{ delivered: boolean }> {
  try {
    const attendance = await prisma.trainingPaygAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        clubMember: {
          select: {
            name: true,
            registrationContactEmail: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!attendance) return { delivered: false };

    const event = await prisma.event.findUnique({
      where: { id: attendance.eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });
    if (!event) return { delivered: false };

    const to =
      attendance.clubMember.user?.email ??
      attendance.clubMember.registrationContactEmail ??
      null;
    if (!to) return { delivered: false };

    return await sendTrainingPaygMovedToWaitingEmail({
      to,
      displayName:
        attendance.clubMember.name ||
        attendance.clubMember.user?.name ||
        "there",
      event,
      hasReceipt: Boolean(attendance.proofScreenshotUrl),
    });
  } catch (error) {
    console.error(
      "[notify] failed to send training PAYG moved-to-waiting email",
      error,
    );
    return { delivered: false };
  }
}
