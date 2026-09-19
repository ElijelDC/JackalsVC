import { jsonServerError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  listStudentIdReviewsForAdmin,
  reviewStudentIdMembershipsBatch,
} from "@/lib/student-id-reviews";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const batchReviewSchema = z.object({
  membershipIds: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["approve", "decline"]),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const reviews = await listStudentIdReviewsForAdmin();
    return NextResponse.json({ reviews });
  } catch (error) {
    return jsonServerError("Could not load student ID reviews", {
      cause: error,
      route: "GET /api/admin/student-id-reviews",
    });
  }
}

export async function PATCH(request: Request) {
  const { session, response: authError } = await requireAdmin();
  if (authError) return authError;

  const { data, response: parseError } = await parseJsonBody(
    request,
    batchReviewSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const result = await reviewStudentIdMembershipsBatch({
      membershipIds: data.membershipIds,
      action: data.action,
      note: data.note,
      reviewerUserId: session!.user.id,
    });

    return NextResponse.json({
      reviews: result.reviews,
      count: result.count,
      message: result.message,
    });
  } catch (error) {
    return jsonServerError("Could not batch review student IDs", {
      cause: error,
      route: "PATCH /api/admin/student-id-reviews",
    });
  }
}
