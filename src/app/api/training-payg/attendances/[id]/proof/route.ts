import { NextResponse } from "next/server";
import { jsonError, jsonServerError, requireSession } from "@/lib/api";
import { submitTrainingPaygProof } from "@/lib/training-payg";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { id } = await params;

  try {
    const formData = await request.formData();
    const screenshot = formData.get("screenshot");
    if (!(screenshot instanceof File)) {
      return jsonError("Screenshot file required", 400);
    }

    const result = await submitTrainingPaygProof({
      userId: session!.user.id,
      attendanceId: id,
      screenshot,
    });
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      attendance: result.attendance,
      autoApproved: result.autoApproved,
      message: result.message,
    });
  } catch (error) {
    return jsonServerError("Could not upload PAYG receipt", {
      route: "POST /api/training-payg/attendances/[id]/proof",
      cause: error,
    });
  }
}
