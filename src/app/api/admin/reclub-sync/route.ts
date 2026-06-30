import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { parseReclubReferenceCode } from "@/lib/reclub-config";
import { syncReclubMeetByReferenceCode } from "@/lib/reclub-sync";

const bodySchema = z
  .object({
    url: z.string().optional(),
    referenceCode: z.string().optional(),
    notifyMembers: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.url || value.referenceCode), {
    message: "Provide a Reclub meet URL or reference code",
  });

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(request, bodySchema);
  if (parseError || !data) return parseError!;

  const referenceCode =
    (data.referenceCode ? parseReclubReferenceCode(data.referenceCode) : null) ??
    (data.url ? parseReclubReferenceCode(data.url) : null);

  if (!referenceCode) {
    return jsonError("Invalid Reclub meet URL or reference code", 400);
  }

  try {
    const result = await syncReclubMeetByReferenceCode(referenceCode, {
      notifyMembers: data.notifyMembers ?? false,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Reclub meet";
    return jsonError(message, 500);
  }
}
