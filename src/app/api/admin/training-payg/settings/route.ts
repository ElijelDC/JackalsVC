import { NextResponse } from "next/server";
import { z } from "zod";
import {
  jsonError,
  jsonServerError,
  parseJsonBody,
  requireAdmin,
} from "@/lib/api";
import {
  getTrainingPaygSettings,
  updateTrainingPaygSettings,
} from "@/lib/training-payg-settings";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  sessionFeeEur: z.number().positive().max(500).optional(),
  paymentUrl: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const settings = await getTrainingPaygSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonServerError("Could not load PAYG settings", {
      route: "GET /api/admin/training-payg/settings",
      cause: error,
    });
  }
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    settingsSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const settings = await updateTrainingPaygSettings(data);
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonServerError("Could not update PAYG settings", {
      route: "PATCH /api/admin/training-payg/settings",
      cause: error,
    });
  }
}
