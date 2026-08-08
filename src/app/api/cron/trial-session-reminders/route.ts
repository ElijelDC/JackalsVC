import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { runTrialSessionDayBeforeReminders } from "@/lib/trial-session-reminders";

async function handle(request: Request) {
  if (!(await authorizeCronRequest(request))) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await runTrialSessionDayBeforeReminders();
    return NextResponse.json(result);
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
