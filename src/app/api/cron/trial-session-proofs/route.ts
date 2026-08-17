import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { purgeExpiredTrialSessionPaymentProofs } from "@/lib/trial-session-proof-cleanup";

async function handle(request: Request) {
  if (!(await authorizeCronRequest(request))) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await purgeExpiredTrialSessionPaymentProofs();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to purge expired session receipts";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
