import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError } from "@/lib/api";
import { runMembershipDueReminders } from "@/lib/membership-due-reminders";

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  const headerSecret = request.headers.get("x-cron-secret");

  if (secret && headerSecret === secret) {
    return true;
  }

  const session = await auth();
  return session?.user?.role === "ADMIN";
}

async function handle(request: Request) {
  if (!(await authorize(request))) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await runMembershipDueReminders();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run due reminders";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
