import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody } from "@/lib/api";
import { parseReclubReferenceCode } from "@/lib/reclub-config";
import { syncReclubMeetByReferenceCode } from "@/lib/reclub-sync";

const webhookSchema = z
  .object({
    url: z.string().optional(),
    referenceCode: z.string().optional(),
    notifyMembers: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.url || value.referenceCode), {
    message: "Provide a Reclub meet URL or reference code",
  });

function authorizeWebhook(request: Request): boolean {
  const secret = process.env.RECLUB_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const headerSecret = request.headers.get("x-reclub-webhook-secret");
  return headerSecret === secret;
}

export async function POST(request: Request) {
  if (!authorizeWebhook(request)) {
    return jsonError("Unauthorized", 401);
  }

  const { data, response } = await parseJsonBody(request, webhookSchema);
  if (response || !data) return response!;

  const referenceCode =
    (data.referenceCode ? parseReclubReferenceCode(data.referenceCode) : null) ??
    (data.url ? parseReclubReferenceCode(data.url) : null);

  if (!referenceCode) {
    return jsonError("Invalid Reclub meet URL or reference code", 400);
  }

  try {
    const result = await syncReclubMeetByReferenceCode(referenceCode, {
      notifyMembers: data.notifyMembers ?? true,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Reclub meet";
    return jsonError(message, 500);
  }
}
