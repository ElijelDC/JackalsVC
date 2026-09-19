import { jsonError, jsonServerError, parseJsonBody, requireAdmin } from "@/lib/api";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";

const reviewSchema = z.object({
  action: z.enum(["approve", "decline"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { data, response } = await parseJsonBody(request, reviewSchema);
  if (response || !data) return response!;

  try {
    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
      },
    });

    if (!membership || !membership.studentIdProofUrl) {
      return jsonError("Student ID review not found", 404);
    }
    if (membership.studentIdReviewStatus !== "PENDING") {
      return jsonError("This student ID has already been reviewed", 409);
    }

    const approved = data.action === "approve";
    const updated = await prisma.membership.update({
      where: { id },
      data: {
        studentIdReviewStatus: approved ? "APPROVED" : "DECLINED",
        studentIdReviewedAt: new Date(),
        studentIdReviewedByUserId: session!.user.id,
        studentIdReviewNote: data.note?.trim() || null,
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
                data.note?.trim()
                  ? `Note from the club: ${data.note.trim()}`
                  : "Please upload a clearer photo of a valid student card or age ID from your membership page.",
              ],
          ctaUrl: emailSiteUrl("/membership"),
          ctaLabel: "Open membership",
        },
      });
    } catch (emailError) {
      console.error("Student ID review email failed:", emailError);
    }

    return NextResponse.json({
      review: {
        id: updated.id,
        studentIdReviewStatus: updated.studentIdReviewStatus,
        studentIdReviewedAt: updated.studentIdReviewedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return jsonServerError("Could not review student ID", {
      cause: error,
      route: "PATCH /api/admin/student-id-reviews/[id]",
    });
  }
}
