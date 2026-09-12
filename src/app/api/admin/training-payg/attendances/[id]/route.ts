import { NextResponse } from "next/server";
import { z } from "zod";
import {
  jsonError,
  jsonServerError,
  parseJsonBody,
  requireAdmin,
} from "@/lib/api";
import { reviewTrainingPaygAttendance } from "@/lib/training-payg";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    reviewSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const result = await reviewTrainingPaygAttendance({
      attendanceId: id,
      status: data.status,
      reviewerUserId: session!.user.id,
    });
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      attendance: result.attendance,
      message:
        data.status === "APPROVED"
          ? result.attendance.proofScreenshotUrl
            ? "Attendance approved"
            : "Attendance approved without receipt"
          : "Attendance rejected",
    });
  } catch (error) {
    return jsonServerError("Could not update PAYG attendance", {
      route: "PATCH /api/admin/training-payg/attendances/[id]",
      cause: error,
    });
  }
}
