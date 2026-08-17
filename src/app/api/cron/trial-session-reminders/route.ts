import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { purgeExpiredTrialSessionPaymentProofs } from "@/lib/trial-session-proof-cleanup";
import { runTrialSessionDayBeforeReminders } from "@/lib/trial-session-reminders";

async function handle(request: Request) {
  if (!(await authorizeCronRequest(request))) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const proofs = await purgeExpiredTrialSessionPaymentProofs();
    const reminders = await runTrialSessionDayBeforeReminders();
    return NextResponse.json({ ...reminders, proofs });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to run session reminders";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
