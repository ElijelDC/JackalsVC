import "server-only";

import { randomUUID } from "crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  deleteTrialSessionPaymentProofFile,
  saveTrialSessionPaymentProofFile,
} from "@/lib/trial-session-payment-proof";
import type {
  PublicTrialSession,
  TrialSessionRecord,
  TrialSessionSignupRecord,
} from "@/lib/trial-session-types";
import {
  isTrialSessionSignupStatus,
  normalizeTrialSessionEmail,
  slugifyTrialSessionTitle,
  TRIAL_SESSION_NEW_RECEIPT_REQUIRED,
  trialSessionRequiresPaymentProof,
  type TrialSessionSignupStatus,
} from "@/lib/trial-session-types";

export const TRIAL_SESSION_SIGNUP_APPROVED = "APPROVED";
export const TRIAL_SESSION_SIGNUP_PENDING = "PENDING";
export const TRIAL_SESSION_SIGNUP_REJECTED = "REJECTED";

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
  status: string;
  createdAt: Date;
  paymentProof?: { proofScreenshotUrl: string } | null;
}): TrialSessionSignupRecord {
  return {
    id: signup.id,
    displayName: signup.displayName,
    email: signup.email,
    status: isTrialSessionSignupStatus(signup.status)
      ? signup.status
      : TRIAL_SESSION_SIGNUP_PENDING,
    createdAt: signup.createdAt.toISOString(),
    reminderSent: false,
    paymentProofUrl: signup.paymentProof?.proofScreenshotUrl ?? null,
  };
}

export async function listTrialSessions() {
  const sessions = await prisma.trialSession.findMany({
    orderBy: { startDate: "desc" },
    include: {
      signups: { select: { status: true } },
    },
  });

  return sessions.map((session) => ({
    ...serializeTrialSession(session),
    signupCount: session.signups.filter(
      (signup) => signup.status === TRIAL_SESSION_SIGNUP_APPROVED,
    ).length,
    pendingApprovalCount: session.signups.filter(
      (signup) => signup.status === TRIAL_SESSION_SIGNUP_PENDING,
    ).length,
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
      viewerPendingApproval: boolean;
      viewerRejected: boolean;
      viewerDisplayName: string | null;
      viewerPaymentProofId: string | null;
    }
  | { ok: false; reason: "not_found" | "inactive" }
> {
  const session = await prisma.trialSession.findUnique({
    where: { slug },
    include: {
      signups: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          displayName: true,
          email: true,
          status: true,
          paymentProof: { select: { id: true } },
        },
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
  const approvedSignups = session.signups.filter(
    (signup) => signup.status === TRIAL_SESSION_SIGNUP_APPROVED,
  );

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
      attendeeCount: approvedSignups.length,
      attendees: approvedSignups.map((signup) => ({
        id: signup.id,
        displayName: signup.displayName,
      })),
    },
    viewerRegistered: viewerSignup?.status === TRIAL_SESSION_SIGNUP_APPROVED,
    viewerPendingApproval: viewerSignup?.status === TRIAL_SESSION_SIGNUP_PENDING,
    viewerRejected: viewerSignup?.status === TRIAL_SESSION_SIGNUP_REJECTED,
    viewerDisplayName: viewerSignup?.displayName ?? null,
    viewerPaymentProofId: viewerSignup?.paymentProof?.id ?? null,
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
      paymentProof: {
        select: { proofScreenshotUrl: true },
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
  input: { email: string; displayName: string; paymentProofId?: string },
) {
  const sessionResult = await getOpenTrialSessionForSignup(slug);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  const email = normalizeTrialSessionEmail(input.email);
  const displayName = input.displayName.trim();
  const requiresProof = trialSessionRequiresPaymentProof(sessionResult.session);

  const existing = await prisma.trialSessionSignup.findUnique({
    where: {
      trialSessionId_email: {
        trialSessionId: sessionResult.session.id,
        email,
      },
    },
  });

  if (existing) {
    if (existing.status === TRIAL_SESSION_SIGNUP_APPROVED) {
      return {
        ok: false as const,
        error: "You're already registered for this session with that email.",
        code: "already_registered" as const,
        existingDisplayName: existing.displayName,
      };
    }

    if (existing.status === TRIAL_SESSION_SIGNUP_PENDING) {
      return {
        ok: false as const,
        error: "Your request is already awaiting admin approval.",
        code: "already_pending" as const,
        existingDisplayName: existing.displayName,
      };
    }

    // Rejected requests must upload a different (new/unlinked) receipt when proof is required.
    if (requiresProof) {
      const resubmitProofId = input.paymentProofId?.trim();
      if (!resubmitProofId) {
        return {
          ok: false as const,
          error: TRIAL_SESSION_NEW_RECEIPT_REQUIRED,
          code: "payment_proof_required" as const,
        };
      }

      const oldLinkedProof = await prisma.trialSessionPaymentProof.findFirst({
        where: { signupId: existing.id },
        select: { id: true },
      });

      if (oldLinkedProof && resubmitProofId === oldLinkedProof.id) {
        return {
          ok: false as const,
          error: TRIAL_SESSION_NEW_RECEIPT_REQUIRED,
          code: "payment_proof_reuse" as const,
        };
      }

      const oldProofUrls: string[] = [];

      try {
        const signup = await prisma.$transaction(async (tx) => {
          const newProof = await tx.trialSessionPaymentProof.findFirst({
            where: {
              id: resubmitProofId,
              trialSessionId: sessionResult.session.id,
              signupId: null,
            },
          });

          if (!newProof) {
            throw new Error("payment_proof_invalid");
          }

          const oldProofs = await tx.trialSessionPaymentProof.findMany({
            where: { signupId: existing.id },
          });

          for (const oldProof of oldProofs) {
            oldProofUrls.push(oldProof.proofScreenshotUrl);
            await tx.trialSessionPaymentProof.delete({
              where: { id: oldProof.id },
            });
          }

          await tx.trialSessionPaymentProof.update({
            where: { id: newProof.id },
            data: { signupId: existing.id },
          });

          return tx.trialSessionSignup.update({
            where: { id: existing.id },
            data: {
              displayName,
              status: TRIAL_SESSION_SIGNUP_PENDING,
            },
          });
        });

        for (const proofUrl of oldProofUrls) {
          await deleteTrialSessionPaymentProofFile(proofUrl);
        }

        return {
          ok: true as const,
          signup: serializeSignup(signup),
          resubmitted: true as const,
        };
      } catch (error) {
        if (error instanceof Error && error.message === "payment_proof_invalid") {
          return {
            ok: false as const,
            error: TRIAL_SESSION_NEW_RECEIPT_REQUIRED,
            code: "payment_proof_invalid" as const,
          };
        }
        throw error;
      }
    }

    const signup = await prisma.trialSessionSignup.update({
      where: { id: existing.id },
      data: {
        displayName,
        status: TRIAL_SESSION_SIGNUP_PENDING,
      },
    });

    return {
      ok: true as const,
      signup: serializeSignup(signup),
      resubmitted: true as const,
    };
  }

  if (requiresProof && !input.paymentProofId?.trim()) {
    return {
      ok: false as const,
      error: "Upload your payment receipt before registering.",
      code: "payment_proof_required" as const,
    };
  }

  if (requiresProof) {
    const proof = await prisma.trialSessionPaymentProof.findFirst({
      where: {
        id: input.paymentProofId!.trim(),
        trialSessionId: sessionResult.session.id,
        signupId: null,
      },
    });

    if (!proof) {
      return {
        ok: false as const,
        error: "Upload a valid payment receipt before registering.",
        code: "payment_proof_invalid" as const,
      };
    }
  }

  let signup;
  try {
    signup = await prisma.$transaction(async (tx) => {
      if (requiresProof) {
        const proof = await tx.trialSessionPaymentProof.findFirst({
          where: {
            id: input.paymentProofId!.trim(),
            trialSessionId: sessionResult.session.id,
            signupId: null,
          },
        });

        if (!proof) {
          throw new Error("payment_proof_invalid");
        }
      }

      const created = await tx.trialSessionSignup.create({
        data: {
          trialSessionId: sessionResult.session.id,
          email,
          displayName,
          status: TRIAL_SESSION_SIGNUP_PENDING,
        },
      });

      if (requiresProof) {
        const linked = await tx.trialSessionPaymentProof.updateMany({
          where: {
            id: input.paymentProofId!.trim(),
            trialSessionId: sessionResult.session.id,
            signupId: null,
          },
          data: { signupId: created.id },
        });

        if (linked.count !== 1) {
          throw new Error("payment_proof_invalid");
        }
      }

      return created;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "payment_proof_invalid") {
      return {
        ok: false as const,
        error: "Upload a valid payment receipt before registering.",
        code: "payment_proof_invalid" as const,
      };
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
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

    throw error;
  }

  return {
    ok: true as const,
    signup: serializeSignup(signup),
    resubmitted: false as const,
  };
}

async function getOpenTrialSessionForSignup(slug: string) {
  const session = await prisma.trialSession.findUnique({ where: { slug } });

  if (!session) {
    return { ok: false as const, error: "This session could not be found." };
  }

  if (!session.active) {
    return {
      ok: false as const,
      error: "Registration is closed for this session.",
    };
  }

  if (session.startDate < new Date()) {
    return {
      ok: false as const,
      error: "This session has already started.",
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

export async function setTrialSessionSignupStatus(
  trialSessionId: string,
  signupId: string,
  status: TrialSessionSignupStatus,
) {
  const signup = await prisma.trialSessionSignup.findFirst({
    where: { id: signupId, trialSessionId },
  });

  if (!signup) {
    return { ok: false as const, error: "Registration not found." };
  }

  if (signup.status === status) {
    return {
      ok: true as const,
      signup: serializeSignup(signup),
      unchanged: true as const,
    };
  }

  const updated = await prisma.trialSessionSignup.update({
    where: { id: signupId },
    data: { status },
    include: {
      paymentProof: { select: { proofScreenshotUrl: true } },
    },
  });

  return {
    ok: true as const,
    signup: serializeSignup(updated),
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

export async function getTrialSessionPaymentProofStatus(
  slug: string,
  proofId: string,
) {
  const session = await prisma.trialSession.findUnique({ where: { slug } });
  if (!session || !session.active) {
    return { ok: false as const, error: "This session could not be found." };
  }

  const proof = await prisma.trialSessionPaymentProof.findFirst({
    where: {
      id: proofId,
      trialSessionId: session.id,
    },
    select: {
      id: true,
      proofScreenshotUrl: true,
      createdAt: true,
      signupId: true,
      signup: {
        select: { status: true },
      },
    },
  });

  if (!proof) {
    return { ok: false as const, error: "Payment receipt not found." };
  }

  const linkedToRejected =
    proof.signup?.status === TRIAL_SESSION_SIGNUP_REJECTED;

  return {
    ok: true as const,
    proof: {
      id: proof.id,
      proofScreenshotUrl: proof.proofScreenshotUrl,
      createdAt: proof.createdAt.toISOString(),
      // Unlinked proofs, or proofs on a rejected request, can be replaced.
      removable: proof.signupId === null || linkedToRejected,
    },
  };
}

export async function createTrialSessionPaymentProof(
  slug: string,
  file: File,
) {
  const sessionResult = await getOpenTrialSessionForSignup(slug);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  if (!trialSessionRequiresPaymentProof(sessionResult.session)) {
    return {
      ok: false as const,
      error: "This session does not require a payment receipt.",
    };
  }

  const proofId = randomUUID();
  const proofScreenshotUrl = await saveTrialSessionPaymentProofFile(
    proofId,
    file,
  );

  const proof = await prisma.trialSessionPaymentProof.create({
    data: {
      id: proofId,
      trialSessionId: sessionResult.session.id,
      proofScreenshotUrl,
    },
  });

  return {
    ok: true as const,
    proof: {
      id: proof.id,
      proofScreenshotUrl: proof.proofScreenshotUrl,
      createdAt: proof.createdAt.toISOString(),
      removable: true,
    },
  };
}

export async function removeTrialSessionPaymentProof(
  slug: string,
  proofId: string,
) {
  const session = await prisma.trialSession.findUnique({ where: { slug } });
  if (!session) {
    return { ok: false as const, error: "This session could not be found." };
  }

  const proof = await prisma.trialSessionPaymentProof.findFirst({
    where: {
      id: proofId,
      trialSessionId: session.id,
    },
    include: {
      signup: {
        select: { status: true },
      },
    },
  });

  if (!proof) {
    return { ok: false as const, error: "Payment receipt not found." };
  }

  const canRemove =
    proof.signupId === null ||
    proof.signup?.status === TRIAL_SESSION_SIGNUP_REJECTED;

  if (!canRemove) {
    return {
      ok: false as const,
      error: "This receipt is linked to an active request and cannot be removed.",
    };
  }

  await deleteTrialSessionPaymentProofFile(proof.proofScreenshotUrl);
  await prisma.trialSessionPaymentProof.delete({ where: { id: proof.id } });

  return { ok: true as const };
}

export { serializeTrialSession };
