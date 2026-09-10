import { NextResponse } from "next/server";
import { z } from "zod";
import {
  jsonError,
  jsonServerError,
  parseJsonBody,
  requireAdmin,
} from "@/lib/api";
import {
  listTrainingPaygAttendancesForAdmin,
  reviewTrainingPaygAttendancesBatch,
} from "@/lib/training-payg";

export const dynamic = "force-dynamic";

const batchReviewSchema = z.object({
  attendanceIds: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const status = new URL(request.url).searchParams.get("status") ?? undefined;

  try {
    const attendances = await listTrainingPaygAttendancesForAdmin(
      status ?? undefined,
    );
    return NextResponse.json({ attendances });
  } catch (error) {
    return jsonServerError("Could not load PAYG attendances", {
      route: "GET /api/admin/training-payg/attendances",
      cause: error,
    });
  }
}

export async function PATCH(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    batchReviewSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const result = await reviewTrainingPaygAttendancesBatch({
      attendanceIds: data.attendanceIds,
      status: data.status,
      reviewerUserId: session!.user.id,
    });

    if (result.count === 0) {
      return jsonError("No matching receipts found", 404);
    }

    return NextResponse.json({
      attendances: result.attendances,
      count: result.count,
      message:
        data.status === "APPROVED"
          ? `Approved ${result.count} receipt${result.count === 1 ? "" : "s"}`
          : `Rejected ${result.count} receipt${result.count === 1 ? "" : "s"}`,
    });
  } catch (error) {
    return jsonServerError("Could not batch update PAYG attendances", {
      route: "PATCH /api/admin/training-payg/attendances",
      cause: error,
    });
  }
}
