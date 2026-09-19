import { jsonError, jsonServerError, parseJsonBody, requireAdmin } from "@/lib/api";
import { reviewStudentIdMembership } from "@/lib/student-id-reviews";
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
    const result = await reviewStudentIdMembership({
      membershipId: id,
      action: data.action,
      note: data.note,
      reviewerUserId: session!.user.id,
    });

    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      review: result.review,
      message: result.message,
    });
  } catch (error) {
    return jsonServerError("Could not review student ID", {
      cause: error,
      route: "PATCH /api/admin/student-id-reviews/[id]",
    });
  }
}
