import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { MEMBERSHIP_PLAN_STUDENT_NAME } from "@/lib/membership-config";
import { prisma } from "@/lib/prisma";
import {
  isStudentIdAwaitingAdminReview,
  resolveStudentIdReviewStatus,
  type StudentIdReviewRecord,
} from "@/lib/student-id-proof";

export type { StudentIdReviewRecord };

function mapReviewRow(row: {
  id: string;
  studentIdProofUrl: string | null;
  studentIdProofSubmittedAt: Date | null;
  studentIdReviewStatus: string | null;
  studentIdReviewNote: string | null;
  plan: { name: string };
  user: { id: string; name: string; email: string };
}): StudentIdReviewRecord {
  return {
    id: row.id,
    planName: row.plan.name,
    studentIdProofUrl: row.studentIdProofUrl,
    studentIdProofSubmittedAt:
      row.studentIdProofSubmittedAt?.toISOString() ?? null,
    studentIdReviewStatus:
      resolveStudentIdReviewStatus({
        planName: row.plan.name,
        studentIdReviewStatus: row.studentIdReviewStatus,
        studentIdProofUrl: row.studentIdProofUrl,
      }) ?? "AWAITING_PROOF",
    studentIdReviewNote: row.studentIdReviewNote,
    user: row.user,
  };
}

/** Active Student/U18 memberships for the admin review screen. */
export async function listStudentIdReviewsForAdmin(): Promise<
  StudentIdReviewRecord[]
> {
  const rows = await prisma.membership.findMany({
    where: {
      endDate: { gt: new Date() },
      plan: { name: MEMBERSHIP_PLAN_STUDENT_NAME },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { name: true } },
    },
    orderBy: [{ studentIdProofSubmittedAt: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(mapReviewRow);
}

export async function reviewStudentIdMembership(input: {
  membershipId: string;
  action: "approve" | "decline";
  note?: string | null;
  reviewerUserId: string;
}): Promise<
  | { ok: true; review: StudentIdReviewRecord; message: string }
  | { ok: false; error: string; status: number }
> {
  const membership = await prisma.membership.findUnique({
    where: { id: input.membershipId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { name: true } },
    },
  });

  if (!membership) {
    return { ok: false, error: "Student ID review not found", status: 404 };
  }

  if (
    !isStudentIdAwaitingAdminReview({
      studentIdReviewStatus: membership.studentIdReviewStatus,
      studentIdProofUrl: membership.studentIdProofUrl,
    })
  ) {
    return {
      ok: false,
      error: "This student ID is not waiting for review",
      status: 409,
    };
  }

  const approved = input.action === "approve";
  const note = input.note?.trim() || null;

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: {
      studentIdReviewStatus: approved ? "APPROVED" : "DECLINED",
      studentIdReviewedAt: new Date(),
      studentIdReviewedByUserId: input.reviewerUserId,
      studentIdReviewNote: note,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { name: true } },
    },
  });

  const memberName = membership.user.name ?? "Member";
  try {
    await sendNotificationEmail({
      to: membership.user.email,
      subject: approved
        ? "Student/U18 ID approved — Jackals VC"
        : "Student/U18 ID needs another look — Jackals VC",
      content: {
        heading: approved
          ? "Student/U18 ID approved"
          : "Student/U18 ID not approved",
        greeting: `Hi ${memberName},`,
        paragraphs: approved
          ? [
              "Your student or under-18 ID has been approved. Your Student/U18 membership rate is confirmed.",
            ]
          : [
              "We couldn't approve the ID you uploaded for the Student/U18 rate.",
              note
                ? `Note from the club: ${note}`
                : "Please upload a clearer photo of a valid student card or age ID from your membership page.",
            ],
        ctaUrl: emailSiteUrl("/membership"),
        ctaLabel: "Open membership",
      },
    });
  } catch (emailError) {
    console.error("Student ID review email failed:", emailError);
  }

  return {
    ok: true,
    review: mapReviewRow(updated),
    message: approved
      ? `Approved ${memberName}'s Student/U18 ID`
      : `Declined ${memberName}'s Student/U18 ID`,
  };
}

export async function reviewStudentIdMembershipsBatch(input: {
  membershipIds: string[];
  action: "approve" | "decline";
  note?: string | null;
  reviewerUserId: string;
}): Promise<{ reviews: StudentIdReviewRecord[]; count: number; message: string }> {
  const reviews: StudentIdReviewRecord[] = [];

  for (const membershipId of input.membershipIds) {
    const result = await reviewStudentIdMembership({
      membershipId,
      action: input.action,
      note: input.note,
      reviewerUserId: input.reviewerUserId,
    });
    if (result.ok) reviews.push(result.review);
  }

  const count = reviews.length;
  return {
    reviews,
    count,
    message:
      input.action === "approve"
        ? `Approved ${count} Student/U18 ID${count === 1 ? "" : "s"}`
        : `Declined ${count} Student/U18 ID${count === 1 ? "" : "s"}`,
  };
}

/** Mark Student/U18 memberships without an approved ID as needing upload. */
export async function backfillStudentIdAwaitingProof(options?: {
  dryRun?: boolean;
}): Promise<{
  dryRun: boolean;
  matched: Array<{
    id: string;
    name: string;
    email: string;
    previousStatus: string | null;
    nextStatus: "AWAITING_PROOF" | "PENDING";
  }>;
  updatedCount: number;
}> {
  const dryRun = Boolean(options?.dryRun);
  const rows = await prisma.membership.findMany({
    where: {
      endDate: { gt: new Date() },
      plan: { name: MEMBERSHIP_PLAN_STUDENT_NAME },
      OR: [
        { studentIdReviewStatus: null },
        { studentIdReviewStatus: { notIn: ["APPROVED", "DECLINED", "PENDING"] } },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const updates = rows.flatMap((row) => {
    if (row.studentIdReviewStatus === "APPROVED") return [];
    if (row.studentIdReviewStatus === "DECLINED") return [];
    if (
      isStudentIdAwaitingAdminReview({
        studentIdReviewStatus: row.studentIdReviewStatus,
        studentIdProofUrl: row.studentIdProofUrl,
      })
    ) {
      return [];
    }

    const hasProof = Boolean(row.studentIdProofUrl?.startsWith("/"));
    const nextStatus = hasProof ? ("PENDING" as const) : ("AWAITING_PROOF" as const);

    // Already correct.
    if (row.studentIdReviewStatus === nextStatus) return [];

    return [
      {
        id: row.id,
        name: row.user.name,
        email: row.user.email,
        previousStatus: row.studentIdReviewStatus,
        nextStatus,
      },
    ];
  });

  if (!dryRun) {
    const awaitingIds = updates
      .filter((row) => row.nextStatus === "AWAITING_PROOF")
      .map((row) => row.id);
    const pendingIds = updates
      .filter((row) => row.nextStatus === "PENDING")
      .map((row) => row.id);

    if (awaitingIds.length > 0) {
      await prisma.membership.updateMany({
        where: { id: { in: awaitingIds } },
        data: {
          studentIdReviewStatus: "AWAITING_PROOF",
          studentIdReviewedAt: null,
          studentIdReviewedByUserId: null,
          studentIdReviewNote: null,
        },
      });
    }
    if (pendingIds.length > 0) {
      await prisma.membership.updateMany({
        where: { id: { in: pendingIds } },
        data: { studentIdReviewStatus: "PENDING" },
      });
    }
  }

  return {
    dryRun,
    matched: updates,
    updatedCount: dryRun ? 0 : updates.length,
  };
}
