import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  PublicTrialSession,
  TrialSessionRecord,
  TrialSessionSignupRecord,
} from "@/lib/trial-session-types";
import {
  normalizeTrialSessionEmail,
  slugifyTrialSessionTitle,
} from "@/lib/trial-session-types";

export type {
  AdminTrialSessionListItem,
  PublicTrialSession,
  TrialSessionRecord,
  TrialSessionSignupRecord,
} from "@/lib/trial-session-types";
export {
  normalizeTrialSessionEmail,
  slugifyTrialSessionTitle,
  trialSessionPublicPath,
} from "@/lib/trial-session-types";

export async function createUniqueTrialSessionSlug(title: string) {
  const base = slugifyTrialSessionTitle(title);
  let slug = base;
  let suffix = 0;

  while (await prisma.trialSession.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

function serializeTrialSession(session: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  locationUrl: string | null;
  paymentUrl: string | null;
  reclubUsername: string | null;
  sessionFee: number | null;
  coachName: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TrialSessionRecord {
  return {
    id: session.id,
    slug: session.slug,
    title: session.title,
    description: session.description,
    startDate: session.startDate.toISOString(),
    endDate: session.endDate?.toISOString() ?? null,
    location: session.location,
    locationUrl: session.locationUrl,
    paymentUrl: session.paymentUrl,
    reclubUsername: session.reclubUsername,
    sessionFee: session.sessionFee,
    coachName: session.coachName,
    active: session.active,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function serializeSignup(signup: {
  id: string;
  displayName: string;
  email: string;
  createdAt: Date;
}): TrialSessionSignupRecord {
  return {
    id: signup.id,
    displayName: signup.displayName,
    email: signup.email,
    createdAt: signup.createdAt.toISOString(),
    reminderSent: false,
  };
}

export async function listTrialSessions() {
  const sessions = await prisma.trialSession.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { signups: true } },
    },
  });

  return sessions.map((session) => ({
    ...serializeTrialSession(session),
    signupCount: session._count.signups,
  }));
}

export async function getTrialSessionBySlug(slug: string) {
  return prisma.trialSession.findUnique({ where: { slug } });
}

export const getPublicTrialSessionBySlug = cache(async function getPublicTrialSessionBySlug(
  slug: string,
  viewerEmail?: string | null,
): Promise<
  | {
      ok: true;
      session: PublicTrialSession;
      viewerRegistered: boolean;
      viewerDisplayName: string | null;
    }
  | { ok: false; reason: "not_found" | "inactive" }
> {
  const session = await prisma.trialSession.findUnique({
    where: { slug },
    include: {
      signups: {
        orderBy: { createdAt: "asc" },
        select: { id: true, displayName: true, email: true },
      },
    },
  });

  if (!session) {
    return { ok: false, reason: "not_found" };
  }

  if (!session.active) {
    return { ok: false, reason: "inactive" };
  }

  const normalizedViewerEmail = viewerEmail
    ? normalizeTrialSessionEmail(viewerEmail)
    : null;

  const viewerSignup = normalizedViewerEmail
    ? session.signups.find((signup) => signup.email === normalizedViewerEmail) ??
      null
    : null;

  const serialized = serializeTrialSession(session);

  return {
    ok: true,
    session: {
      id: serialized.id,
      slug: serialized.slug,
      title: serialized.title,
      description: serialized.description,
      startDate: serialized.startDate,
      endDate: serialized.endDate,
      location: serialized.location,
      locationUrl: serialized.locationUrl,
      paymentUrl: serialized.paymentUrl,
      reclubUsername: serialized.reclubUsername,
      sessionFee: serialized.sessionFee,
      coachName: serialized.coachName,
      active: serialized.active,
      attendeeCount: session.signups.length,
      attendees: session.signups.map((signup) => ({
        id: signup.id,
        displayName: signup.displayName,
      })),
    },
    viewerRegistered: Boolean(viewerSignup),
    viewerDisplayName: viewerSignup?.displayName ?? null,
  };
});

export async function listTrialSessionSignupsForAdmin(trialSessionId: string) {
  const signups = await prisma.trialSessionSignup.findMany({
    where: { trialSessionId },
    orderBy: { createdAt: "asc" },
    include: {
      reminders: {
        where: { kind: "DAY" },
        select: { id: true },
        take: 1,
      },
    },
  });

  return signups.map((signup) => ({
    ...serializeSignup(signup),
    reminderSent: signup.reminders.length > 0,
  }));
}

export async function registerForTrialSession(
  slug: string,
  input: { email: string; displayName: string },
) {
  const sessionResult = await getOpenTrialSessionForSignup(slug);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  const email = normalizeTrialSessionEmail(input.email);
  const displayName = input.displayName.trim();

  const existing = await prisma.trialSessionSignup.findUnique({
    where: {
      trialSessionId_email: {
        trialSessionId: sessionResult.session.id,
        email,
      },
    },
  });

  if (existing) {
    return {
      ok: false as const,
      error: "You're already registered for this session with that email.",
      code: "already_registered" as const,
      existingDisplayName: existing.displayName,
    };
  }

  const signup = await prisma.trialSessionSignup.create({
    data: {
      trialSessionId: sessionResult.session.id,
      email,
      displayName,
    },
  }).catch((error: unknown) => {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return null;
    }
    throw error;
  });

  if (!signup) {
    const raced = await prisma.trialSessionSignup.findUnique({
      where: {
        trialSessionId_email: {
          trialSessionId: sessionResult.session.id,
          email,
        },
      },
    });

    return {
      ok: false as const,
      error: "You're already registered for this session with that email.",
      code: "already_registered" as const,
      existingDisplayName: raced?.displayName ?? displayName,
    };
  }

  return {
    ok: true as const,
    signup: serializeSignup(signup),
  };
}

async function getOpenTrialSessionForSignup(slug: string) {
  const session = await prisma.trialSession.findUnique({ where: { slug } });

  if (!session) {
    return { ok: false as const, error: "This trial session could not be found." };
  }

  if (!session.active) {
    return {
      ok: false as const,
      error: "Registration is closed for this trial session.",
    };
  }

  if (session.startDate < new Date()) {
    return {
      ok: false as const,
      error: "This trial session has already started.",
    };
  }

  return { ok: true as const, session };
}

export async function updateTrialSessionSignup(
  slug: string,
  input: { email: string; displayName: string },
) {
  const sessionResult = await getOpenTrialSessionForSignup(slug);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  const email = normalizeTrialSessionEmail(input.email);
  const displayName = input.displayName.trim();

  const existing = await prisma.trialSessionSignup.findUnique({
    where: {
      trialSessionId_email: {
        trialSessionId: sessionResult.session.id,
        email,
      },
    },
  });

  if (!existing) {
    return {
      ok: false as const,
      error: "No registration found for that email.",
      code: "not_registered" as const,
    };
  }

  if (existing.displayName === displayName) {
    return {
      ok: true as const,
      signup: serializeSignup(existing),
      unchanged: true as const,
    };
  }

  const signup = await prisma.trialSessionSignup.update({
    where: { id: existing.id },
    data: { displayName },
  });

  return {
    ok: true as const,
    signup: serializeSignup(signup),
    unchanged: false as const,
  };
}

export async function removeTrialSessionSignup(
  trialSessionId: string,
  signupId: string,
) {
  const signup = await prisma.trialSessionSignup.findFirst({
    where: { id: signupId, trialSessionId },
  });

  if (!signup) {
    return { ok: false as const, error: "Registration not found." };
  }

  await prisma.trialSessionSignup.delete({ where: { id: signupId } });
  return { ok: true as const };
}

export { serializeTrialSession };
