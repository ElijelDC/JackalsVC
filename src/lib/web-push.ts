import "server-only";

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function getVapidConfig() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    process.env.VAPID_PUBLIC_KEY?.trim() ||
    "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "mailto:thunderjackals@gmail.com";

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured() {
  return Boolean(getVapidConfig());
}

export function getVapidPublicKey() {
  return getVapidConfig()?.publicKey ?? null;
}

function configureWebPush() {
  const config = getVapidConfig();
  if (!config) return null;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ delivered: number; failed: number }> {
  if (!configureWebPush()) {
    return { delivered: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { delivered: 0, failed: 0 };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/dashboard",
  });

  let delivered = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          body,
          { TTL: 60 * 60 * 12 },
        );
        delivered += 1;
      } catch (error) {
        failed += 1;
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : null;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          }).catch(() => undefined);
        }
      }
    }),
  );

  return { delivered, failed };
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  let delivered = 0;
  let failed = 0;
  for (const userId of unique) {
    const result = await sendPushToUser(userId, payload);
    delivered += result.delivered;
    failed += result.failed;
  }
  return { delivered, failed };
}
