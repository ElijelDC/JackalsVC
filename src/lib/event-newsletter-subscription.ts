import { prisma } from "@/lib/prisma";
import type { EventNewsletterSource } from "@/lib/event-newsletter-config";

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function isSubscribedToEventNewsletter(email: string) {
  const subscription = await prisma.eventNewsletterSubscription.findUnique({
    where: { email: normalizeNewsletterEmail(email) },
    select: { active: true },
  });
  return subscription?.active === true;
}

export async function getSubscribedEventNewsletterEmails() {
  const subscriptions = await prisma.eventNewsletterSubscription.findMany({
    where: { active: true },
    select: { email: true },
  });
  return subscriptions.map((row) => row.email);
}

export async function subscribeToEventNewsletter(input: {
  email: string;
  userId?: string | null;
  source?: EventNewsletterSource;
}) {
  const email = normalizeNewsletterEmail(input.email);

  const existing = await prisma.eventNewsletterSubscription.findUnique({
    where: { email },
    select: { id: true, userId: true },
  });

  if (existing) {
    return prisma.eventNewsletterSubscription.update({
      where: { email },
      data: {
        active: true,
        source: input.source ?? undefined,
        ...(input.userId && !existing.userId ? { userId: input.userId } : {}),
      },
      select: { email: true, active: true },
    });
  }

  if (input.userId) {
    const linked = await prisma.eventNewsletterSubscription.findUnique({
      where: { userId: input.userId },
      select: { id: true, email: true },
    });

    if (linked && linked.email !== email) {
      await prisma.eventNewsletterSubscription.update({
        where: { id: linked.id },
        data: { userId: null },
      });
    }
  }

  return prisma.eventNewsletterSubscription.create({
    data: {
      email,
      userId: input.userId ?? undefined,
      active: true,
      source: input.source,
    },
    select: { email: true, active: true },
  });
}

export async function unsubscribeFromEventNewsletter(email: string) {
  const normalized = normalizeNewsletterEmail(email);
  const existing = await prisma.eventNewsletterSubscription.findUnique({
    where: { email: normalized },
    select: { id: true },
  });

  if (!existing) {
    return { email: normalized, active: false };
  }

  return prisma.eventNewsletterSubscription.update({
    where: { email: normalized },
    data: { active: false },
    select: { email: true, active: true },
  });
}
