import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import { sendTrialSessionReminders } from "@/lib/trial-session-reminders";

type SendReminderBody = {
  signupIds?: string[];
};

function parseSignupIds(body: unknown): string[] | undefined {
  if (body == null || typeof body !== "object") return undefined;

  const signupIds = (body as SendReminderBody).signupIds;
  if (signupIds == null) return undefined;

  if (
    !Array.isArray(signupIds) ||
    signupIds.some((id) => typeof id !== "string" || id.trim() === "")
  ) {
    throw new Error("Invalid signup selection");
  }

  return signupIds;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  if (!isEmailConfigured()) {
    return jsonError("Email delivery is not configured", 503);
  }

  const { id } = await params;

  let signupIds: string[] | undefined;
  try {
    const body = await request.json().catch(() => null);
    signupIds = parseSignupIds(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request body";
    return jsonError(message, 400);
  }

  try {
    const result = await sendTrialSessionReminders(id, { signupIds });

    if (result.attempted === 0) {
      return jsonError(
        signupIds && signupIds.length > 0
          ? "Selected attendees have already received a reminder."
          : result.skipped > 0
            ? "Reminders have already been sent to all registered attendees."
            : "No registered attendees to email.",
        400,
      );
    }

    if (result.delivered === 0) {
      return jsonError(
        "Email could not be sent. Check SMTP settings and try again.",
        503,
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send reminders";
    const status =
      message === "Session not found"
        ? 404
        : message === "This session has already started" ||
            message ===
              "Reminders can only be sent within 24 hours of the session start" ||
            message === "One or more selected attendees were not found" ||
            message === "Invalid signup selection"
          ? 400
          : 500;
    return jsonError(message, status);
  }
}
