import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isWebPushConfigured } from "@/lib/web-push";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }).passthrough(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }
  if (!isWebPushConfigured()) {
    return jsonError("Push notifications are not configured", 503);
  }

  const { data, response } = await parseJsonBody(request, subscribeSchema);
  if (!data) return response;

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      userId: session.user.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent,
    },
    update: {
      userId: session.user.id,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { data, response } = await parseJsonBody(
    request,
    z.object({ endpoint: z.string().url() }),
  );
  if (!data) return response;

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: session.user.id,
      endpoint: data.endpoint,
    },
  });

  return NextResponse.json({ ok: true });
}
