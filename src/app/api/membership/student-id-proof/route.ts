import { jsonError, jsonServerError, requireSession } from "@/lib/api";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { isStudentMembershipPlanName } from "@/lib/membership-config";
import { prisma } from "@/lib/prisma";
import {
  deleteStudentIdProofFile,
  saveStudentIdProofFile,
  validateStudentIdProofFile,
} from "@/lib/student-id-proof";
import { NextResponse } from "next/server";

/** Re-upload student ID after a decline (or replace a pending proof). */
export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const screenshot = formData.get("studentIdProof");
    if (!(screenshot instanceof File)) {
      return jsonError("Student ID photo required", 400);
    }
    const fileError = validateStudentIdProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session!.user.id,
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!membership) {
      return jsonError("No active membership found", 404);
    }
    if (!isStudentMembershipPlanName(membership.plan.name)) {
      return jsonError("Student ID is only required for Student/U18 membership", 400);
    }

    const previousUrl = membership.studentIdProofUrl;
    const studentIdProofUrl = await saveStudentIdProofFile(
      session!.user.id,
      screenshot,
    );

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: {
        studentIdProofUrl,
        studentIdProofSubmittedAt: new Date(),
        studentIdReviewStatus: "PENDING",
        studentIdReviewedAt: null,
        studentIdReviewedByUserId: null,
        studentIdReviewNote: null,
      },
      include: { plan: true },
    });

    if (previousUrl && previousUrl !== studentIdProofUrl) {
      await deleteStudentIdProofFile(previousUrl).catch(() => undefined);
    }

    const memberName = session!.user.name ?? "A member";
    await notifyAdmins({
      subject: `Student/U18 ID re-uploaded — ${memberName}`,
      content: {
        heading: "Student/U18 ID needs review",
        paragraphs: [
          `${memberName} uploaded a new student or under-18 ID for their Student/U18 membership.`,
        ],
        details: [
          { label: "Member", value: memberName },
          { label: "Plan", value: membership.plan.name },
        ],
        imageUrl: emailSiteUrl(studentIdProofUrl),
        imageAlt: "Submitted student / U18 ID",
        ctaUrl: emailSiteUrl("/admin/student-id-reviews"),
        ctaLabel: "Review student ID",
      },
    });

    return NextResponse.json({
      membership: {
        id: updated.id,
        studentIdProofUrl: updated.studentIdProofUrl,
        studentIdReviewStatus: updated.studentIdReviewStatus,
        studentIdProofSubmittedAt:
          updated.studentIdProofSubmittedAt?.toISOString() ?? null,
      },
      message: "Student ID uploaded. An admin will review it shortly.",
    });
  } catch (error) {
    return jsonServerError("Could not upload student ID", {
      cause: error,
      route: "POST /api/membership/student-id-proof",
    });
  }
}
