import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const newsletterSchema = z.object({
  optOut: z.boolean(),
});

export async function PATCH(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    newsletterSchema,
    "Invalid newsletter preference.",
  );
  if (parseError || !data) return parseError!;

  try {
    const updated = await prisma.user.update({
      where: { id: session!.user.id },
      data: { eventNewsletterOptOut: data.optOut },
      select: { eventNewsletterOptOut: true },
    });

    return NextResponse.json({
      eventNewsletterOptOut: updated.eventNewsletterOptOut,
    });
  } catch (error) {
    console.error("Failed to update newsletter preference:", error);
    return jsonError("Failed to update newsletter preference", 500);
  }
}
