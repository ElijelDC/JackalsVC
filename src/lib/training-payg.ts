import "server-only";

import { getClubBankDetails } from "@/lib/payments";
import { isPaygPlayer } from "@/lib/player-payment-type";
import {
  serializeTrainingPaygAttendance,
  type TrainingPaygAttendanceRecord,
} from "@/lib/player-payment-type";
import { prisma } from "@/lib/prisma";
import { ensureTrainingSignupReminder } from "@/lib/training-signups";
import {
  deleteTrainingPaygProofFile,
  saveTrainingPaygProofFile,
  validateTrainingPaygProofFile,
} from "@/lib/training-payg-payment-proof";
import {
  buildTrainingPaygPaymentReference,
  getTrainingPaygSettings,
} from "@/lib/training-payg-settings";
import {
  notifyTrainingPaygApproved,
  notifyTrainingPaygRejected,
} from "@/lib/send-training-payg-email";
import { userCanSignUpForTrainingEvent } from "@/lib/training-teams";

const ATTENDANCE_INCLUDE = {
  clubMember: {
    select: {
      name: true,
      registrationContactEmail: true,
      user: { select: { email: true, name: true } },
    },
  },
} as const;

export async function getPaygClubMemberForUser(userId: string) {
  return prisma.clubMember.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      rosterRole: true,
      playerPaymentType: true,
      trainingTeamKey: true,
      active: true,
    },
  });
}

export async function userIsPaygTrainingPlayer(userId: string) {
  const member = await getPaygClubMemberForUser(userId);
  if (!member || !member.active) return false;
  return (
    isPaygPlayer(member.rosterRole, member.playerPaymentType) &&
    Boolean(member.trainingTeamKey)
  );
}

export async function getTrainingPaygAttendanceForUserEvent(
  userId: string,
  eventId: string,
): Promise<TrainingPaygAttendanceRecord | null> {
  const row = await prisma.trainingPaygAttendance.findUnique({
    where: { userId_eventId: { userId, eventId } },
    include: ATTENDANCE_INCLUDE,
  });
  if (!row) return null;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      startDate: true,
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });

  return serializeTrainingPaygAttendance({
    ...row,
    event: event
      ? {
          title: event.title,
          startDate: event.startDate,
          trainingTeamKey: event.trainingSession?.trainingTeamKey ?? null,
        }
      : undefined,
  });
}

async function markEventAttending(userId: string, eventId: string) {
  await prisma.eventSignup.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId, status: "ATTENDING" },
    update: { status: "ATTENDING" },
  });
  await ensureTrainingSignupReminder(userId, eventId);
}

export async function ensureTrainingPaygAttendance(input: {
  userId: string;
  eventId: string;
}): Promise<
  | {
      ok: true;
      attendance: TrainingPaygAttendanceRecord;
      bank: ReturnType<typeof getClubBankDetails>;
      paymentUrl: string;
      alreadyApproved: boolean;
    }
  | { ok: false; error: string; status: number }
> {
  const settings = await getTrainingPaygSettings();
  if (!settings.active) {
    return {
      ok: false,
      error: "Pay Per Training payments are currently disabled",
      status: 403,
    };
  }

  const member = await getPaygClubMemberForUser(input.userId);
  if (
    !member ||
    !member.active ||
    !isPaygPlayer(member.rosterRole, member.playerPaymentType) ||
    !member.trainingTeamKey
  ) {
    return {
      ok: false,
      error: "Pay Per Training is only available for squad players on that plan",
      status: 403,
    };
  }

  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: {
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });
  if (!event || event.type !== "TRAINING") {
    return { ok: false, error: "Training session not found", status: 404 };
  }
  if (
    !(await userCanSignUpForTrainingEvent(
      input.userId,
      event.trainingSession?.trainingTeamKey,
    ))
  ) {
    return {
      ok: false,
      error: "You can only pay for your team's training sessions",
      status: 403,
    };
  }
  if (event.startDate < new Date()) {
    return {
      ok: false,
      error: "This training session has already started",
      status: 400,
    };
  }

  const existing = await prisma.trainingPaygAttendance.findUnique({
    where: {
      userId_eventId: { userId: input.userId, eventId: input.eventId },
    },
    include: ATTENDANCE_INCLUDE,
  });

  if (existing?.status === "APPROVED") {
    await markEventAttending(input.userId, input.eventId);
    return {
      ok: true,
      attendance: serializeTrainingPaygAttendance({
        ...existing,
        event: {
          title: event.title,
          startDate: event.startDate,
          trainingTeamKey: event.trainingSession?.trainingTeamKey ?? null,
        },
      }),
      bank: getClubBankDetails(),
      paymentUrl: settings.paymentUrl,
      alreadyApproved: true,
    };
  }

  const paymentReference = buildTrainingPaygPaymentReference(
    member.name,
    event.startDate,
  );

  const row = existing
    ? await prisma.trainingPaygAttendance.update({
        where: { id: existing.id },
        data: {
          amountDue: settings.sessionFeeEur,
          paymentReference,
          ...(existing.status === "REJECTED"
            ? {
                status: "AWAITING_PROOF",
                proofScreenshotUrl: null,
                aiDecision: null,
                aiRawAmount: null,
                aiNotes: null,
                reviewedAt: null,
                reviewedByUserId: null,
              }
            : {}),
        },
        include: ATTENDANCE_INCLUDE,
      })
    : await prisma.trainingPaygAttendance.create({
        data: {
          clubMemberId: member.id,
          userId: input.userId,
          eventId: input.eventId,
          amountDue: settings.sessionFeeEur,
          paymentReference,
          status: "AWAITING_PROOF",
        },
        include: ATTENDANCE_INCLUDE,
      });

  if (
    existing?.status === "REJECTED" &&
    existing.proofScreenshotUrl &&
    existing.proofScreenshotUrl !== row.proofScreenshotUrl
  ) {
    await deleteTrainingPaygProofFile(existing.proofScreenshotUrl).catch(
      () => undefined,
    );
  }

  return {
    ok: true,
    attendance: serializeTrainingPaygAttendance({
      ...row,
      event: {
        title: event.title,
        startDate: event.startDate,
        trainingTeamKey: event.trainingSession?.trainingTeamKey ?? null,
      },
    }),
    bank: getClubBankDetails(),
    paymentUrl: settings.paymentUrl,
    alreadyApproved: false,
  };
}

export async function submitTrainingPaygProof(input: {
  userId: string;
  attendanceId: string;
  screenshot: File;
}): Promise<
  | {
      ok: true;
      attendance: TrainingPaygAttendanceRecord;
      autoApproved: boolean;
      message: string;
    }
  | { ok: false; error: string; status: number }
> {
  const fileError = validateTrainingPaygProofFile(input.screenshot);
  if (fileError) {
    return { ok: false, error: fileError, status: 400 };
  }

  const attendance = await prisma.trainingPaygAttendance.findUnique({
    where: { id: input.attendanceId },
    include: ATTENDANCE_INCLUDE,
  });
  if (!attendance || attendance.userId !== input.userId) {
    return { ok: false, error: "Attendance payment not found", status: 404 };
  }
  if (attendance.status === "APPROVED") {
    return {
      ok: true,
      attendance: serializeTrainingPaygAttendance(attendance),
      autoApproved: true,
      message: "You're already approved for this session.",
    };
  }

  const settings = await getTrainingPaygSettings();
  if (!settings.active) {
    return {
      ok: false,
      error: "Pay Per Training payments are currently disabled",
      status: 403,
    };
  }

  const previousUrl = attendance.proofScreenshotUrl;
  const proofScreenshotUrl = await saveTrainingPaygProofFile(
    attendance.id,
    input.screenshot,
  );

  const updated = await prisma.trainingPaygAttendance.update({
    where: { id: attendance.id },
    data: {
      proofScreenshotUrl,
      aiDecision: null,
      aiRawAmount: null,
      aiNotes: null,
      status: "PENDING",
      reviewedAt: null,
      reviewedByUserId: null,
    },
    include: ATTENDANCE_INCLUDE,
  });

  if (previousUrl && previousUrl !== proofScreenshotUrl) {
    await deleteTrainingPaygProofFile(previousUrl).catch(() => undefined);
  }

  const event = await prisma.event.findUnique({
    where: { id: attendance.eventId },
    select: {
      title: true,
      startDate: true,
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });

  return {
    ok: true,
    attendance: serializeTrainingPaygAttendance({
      ...updated,
      event: event
        ? {
            title: event.title,
            startDate: event.startDate,
            trainingTeamKey: event.trainingSession?.trainingTeamKey ?? null,
          }
        : undefined,
    }),
    autoApproved: false,
    message: "Receipt uploaded. An admin will review it shortly.",
  };
}

export async function listTrainingPaygAttendancesForAdmin(status?: string) {
  const where =
    status && status !== "ALL"
      ? { status }
      : { status: { in: ["PENDING", "AWAITING_PROOF", "APPROVED", "REJECTED"] } };

  const rows = await prisma.trainingPaygAttendance.findMany({
    where,
    include: ATTENDANCE_INCLUDE,
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 200,
  });

  const eventIds = [...new Set(rows.map((row) => row.eventId))];
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: {
      id: true,
      title: true,
      startDate: true,
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });
  const eventById = new Map(events.map((event) => [event.id, event]));

  return rows.map((row) => {
    const event = eventById.get(row.eventId);
    return serializeTrainingPaygAttendance({
      ...row,
      event: event
        ? {
            title: event.title,
            startDate: event.startDate,
            trainingTeamKey: event.trainingSession?.trainingTeamKey ?? null,
          }
        : undefined,
    });
  });
}

export async function reviewTrainingPaygAttendance(input: {
  attendanceId: string;
  status: "APPROVED" | "REJECTED";
  reviewerUserId: string;
}): Promise<
  | { ok: true; attendance: TrainingPaygAttendanceRecord }
  | { ok: false; error: string; status: number }
> {
  const existing = await prisma.trainingPaygAttendance.findUnique({
    where: { id: input.attendanceId },
    include: ATTENDANCE_INCLUDE,
  });
  if (!existing) {
    return { ok: false, error: "Attendance not found", status: 404 };
  }

  const updated = await prisma.trainingPaygAttendance.update({
    where: { id: input.attendanceId },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      reviewedByUserId: input.reviewerUserId,
    },
    include: ATTENDANCE_INCLUDE,
  });

  if (input.status === "APPROVED") {
    await markEventAttending(updated.userId, updated.eventId);
    void notifyTrainingPaygApproved(updated.id);
  } else {
    await prisma.eventSignup.deleteMany({
      where: {
        userId: updated.userId,
        eventId: updated.eventId,
        status: "ATTENDING",
      },
    });
    void notifyTrainingPaygRejected(updated.id);
  }

  const event = await prisma.event.findUnique({
    where: { id: updated.eventId },
    select: {
      title: true,
      startDate: true,
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });

  return {
    ok: true,
    attendance: serializeTrainingPaygAttendance({
      ...updated,
      event: event
        ? {
            title: event.title,
            startDate: event.startDate,
            trainingTeamKey: event.trainingSession?.trainingTeamKey ?? null,
          }
        : undefined,
    }),
  };
}

export async function reviewTrainingPaygAttendancesBatch(input: {
  attendanceIds: string[];
  status: "APPROVED" | "REJECTED";
  reviewerUserId: string;
}): Promise<{
  ok: true;
  attendances: TrainingPaygAttendanceRecord[];
  count: number;
}> {
  const uniqueIds = [...new Set(input.attendanceIds.filter(Boolean))];
  const results: TrainingPaygAttendanceRecord[] = [];

  for (const attendanceId of uniqueIds) {
    const result = await reviewTrainingPaygAttendance({
      attendanceId,
      status: input.status,
      reviewerUserId: input.reviewerUserId,
    });
    if (result.ok) results.push(result.attendance);
  }

  return { ok: true, attendances: results, count: results.length };
}

export async function paygMemberHasApprovedAttendance(
  userId: string,
  eventId: string,
) {
  const row = await prisma.trainingPaygAttendance.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true },
  });
  return row?.status === "APPROVED";
}
