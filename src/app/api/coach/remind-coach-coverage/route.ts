import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, jsonError, parseJsonBody } from "@/lib/api";
import { sendCoachCoverageReminders } from "@/lib/coach-coverage-reminders";

const schema = z.object({
  eventId: z.string().min(1),
});

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session?.user?.id) return response!;

  const { data, response: parseError } = await parseJsonBody(request, schema);
  if (parseError || !data) return parseError!;

  const result = await sendCoachCoverageReminders({
    eventId: data.eventId,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({
    success: true,
    phase: result.phase,
    notifiedCount: result.notifiedCount,
    recipientNames: result.recipientNames,
    preview: result.preview,
    message:
      result.phase === "head"
        ? `Reminder sent to head coach (${result.recipientNames.join(", ")}).`
        : `Reminder sent to cover coach${result.notifiedCount === 1 ? "" : "es"} (${result.recipientNames.join(", ")}).`,
  });
}
