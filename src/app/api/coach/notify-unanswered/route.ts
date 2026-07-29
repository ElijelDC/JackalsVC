import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCoach } from "@/lib/coach-auth";
import { sendCoachUnansweredReminders } from "@/lib/coach-response-reminders";
import { getCoachUnansweredItems } from "@/lib/coach-unanswered";
import { jsonError, parseJsonBody } from "@/lib/api";

const notifySchema = z.object({
  kind: z.enum(["training", "match"]),
  id: z.string().min(1),
});

export async function GET() {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const pending = await getCoachUnansweredItems(coach!.trainingTeamKeys);
  return NextResponse.json({ pending });
}

export async function POST(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    notifySchema,
  );
  if (parseError || !data) return parseError!;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;

  const result = await sendCoachUnansweredReminders({
    coach: coach!,
    kind: data.kind,
    id: data.id,
    siteUrl,
  });

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  return NextResponse.json({
    success: true,
    notifiedCount: result.notifiedCount,
    deliveredCount: result.deliveredCount,
    loggedCount: result.loggedCount,
    kind: result.kind,
    id: result.id,
    cooldown: result.cooldown,
  });
}
