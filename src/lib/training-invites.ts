import "server-only";

import { randomBytes } from "crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getTrainingPaygSettings } from "@/lib/training-payg-settings";
import { getTrainingTeamByKey } from "@/lib/training-squads";
import {
  deleteTrainingInvitePaymentProofFile,
  saveTrainingInvitePaymentProofFile,
} from "@/lib/training-invite-payment-proof";
import type {
  PublicTrainingInvite,
  TrainingInviteGuestAttendee,
  TrainingInvitePricingType,
  TrainingInviteRecord,
  TrainingInviteSignupRecord,
  TrainingInviteSignupStatus,
} from "@/lib/training-invite-types";
import {
  isTrainingInviteSignupStatus,
  normalizeTrainingInviteEmail,
  TRAINING_INVITE_NEW_RECEIPT_REQUIRED,
  trainingInvitePublicPath,
  trainingInviteRequiresPaymentProof,
} from "@/lib/training-invite-types";

export const TRAINING_INVITE_SIGNUP_APPROVED = "APPROVED";
export const TRAINING_INVITE_SIGNUP_PENDING = "PENDING";
export const TRAINING_INVITE_SIGNUP_REJECTED = "REJECTED";
export const TRAINING_INVITE_ACTIVE = "ACTIVE";
export const TRAINING_INVITE_REVOKED = "REVOKED";

function serializeInvite(invite: {
  id: string;
  token: string;
  eventId: string;
  pricingType: string;
  sessionFeeEur: number | null;
  paymentUrl: string | null;
  status: string;
  createdAt: Date;
}): TrainingInviteRecord {
  return {
    id: invite.id,
    token: invite.token,
    eventId: invite.eventId,
    pricingType: invite.pricingType as TrainingInvitePricingType,
    sessionFeeEur: invite.sessionFeeEur,
    paymentUrl: invite.paymentUrl,
    status: invite.status === TRAINING_INVITE_REVOKED ? "REVOKED" : "ACTIVE",
    createdAt: invite.createdAt.toISOString(),
    publicPath: trainingInvitePublicPath(invite.token),
  };
}

function serializeSignup(signup: {
  id: string;
  inviteId: string;
  displayName: string;
  email: string;
  status: string;
  createdAt: Date;
  invite?: { pricingType: string } | null;
  paymentProof?: { proofScreenshotUrl: string } | null;
}): TrainingInviteSignupRecord {
  return {
    id: signup.id,
    inviteId: signup.inviteId,
    displayName: signup.displayName,
    email: signup.email,
    status: isTrainingInviteSignupStatus(signup.status)
      ? signup.status
      : TRAINING_INVITE_SIGNUP_PENDING,
    pricingType: (signup.invite?.pricingType ?? "FREE") as TrainingInvitePricingType,
    createdAt: signup.createdAt.toISOString(),
    paymentProofUrl: signup.paymentProof?.proofScreenshotUrl ?? null,
  };
}

async function getTrainingEventForInvite(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      trainingSession: {
        select: {
          trainingTeamKey: true,
          coach: true,
          description: true,
        },
      },
    },
  });

  if (!event || event.type !== "TRAINING" || !event.trainingSession?.trainingTeamKey) {
    return null;
  }

  return event;
}

export async function createOrGetTrainingInvite(input: {
  eventId: string;
  pricingType: TrainingInvitePricingType;
  createdByUserId: string;
  createdByClubMemberId?: string | null;
  regenerate?: boolean;
}) {
  const event = await getTrainingEventForInvite(input.eventId);
  if (!event) {
    return { ok: false as const, error: "Training session not found." };
  }

  if (event.startDate.getTime() < Date.now()) {
    return {
      ok: false as const,
      error: "Cannot create invites for sessions that have already started.",
    };
  }

  const existing = await prisma.trainingInvite.findFirst({
    where: {
      eventId: input.eventId,
      pricingType: input.pricingType,
      status: TRAINING_INVITE_ACTIVE,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing && !input.regenerate) {
    return { ok: true as const, invite: serializeInvite(existing), created: false };
  }

  const payg =
    input.pricingType === "PAID" ? await getTrainingPaygSettings() : null;

  if (existing && input.regenerate) {
    const updated = await prisma.trainingInvite.update({
      where: { id: existing.id },
      data: {
        token: randomBytes(18).toString("hex"),
        sessionFeeEur: input.pricingType === "PAID" ? payg!.sessionFeeEur : null,
        paymentUrl:
          input.pricingType === "PAID"
            ? payg!.paymentUrl.trim() || null
            : null,
      },
    });
    return { ok: true as const, invite: serializeInvite(updated), created: false };
  }

  const invite = await prisma.trainingInvite.create({
    data: {
      eventId: input.eventId,
      pricingType: input.pricingType,
      sessionFeeEur: input.pricingType === "PAID" ? payg!.sessionFeeEur : null,
      paymentUrl:
        input.pricingType === "PAID"
          ? payg!.paymentUrl.trim() || null
          : null,
      createdByUserId: input.createdByUserId,
      createdByClubMemberId: input.createdByClubMemberId ?? null,
      status: TRAINING_INVITE_ACTIVE,
    },
  });

  return { ok: true as const, invite: serializeInvite(invite), created: true };
}

export async function listTrainingInvitesForEvent(eventId: string) {
  const invites = await prisma.trainingInvite.findMany({
    where: { eventId, status: TRAINING_INVITE_ACTIVE },
    orderBy: { createdAt: "asc" },
    include: {
      signups: {
        orderBy: { createdAt: "asc" },
        include: {
          paymentProof: { select: { proofScreenshotUrl: true } },
        },
      },
    },
  });

  return invites.map((invite) => ({
    ...serializeInvite(invite),
    signups: invite.signups.map((signup) =>
      serializeSignup({ ...signup, invite: { pricingType: invite.pricingType } }),
    ),
    pendingCount: invite.signups.filter(
      (signup) => signup.status === TRAINING_INVITE_SIGNUP_PENDING,
    ).length,
    approvedCount: invite.signups.filter(
      (signup) => signup.status === TRAINING_INVITE_SIGNUP_APPROVED,
    ).length,
  }));
}

export async function listApprovedGuestAttendeesForEvent(
  eventId: string,
): Promise<TrainingInviteGuestAttendee[]> {
  const signups = await prisma.trainingInviteSignup.findMany({
    where: {
      status: TRAINING_INVITE_SIGNUP_APPROVED,
      invite: { eventId, status: TRAINING_INVITE_ACTIVE },
    },
    orderBy: { createdAt: "asc" },
    include: {
      invite: { select: { pricingType: true } },
    },
  });

  return signups.map((signup) => ({
    id: signup.id,
    displayName: signup.displayName,
    email: signup.email,
    pricingType: signup.invite.pricingType as TrainingInvitePricingType,
  }));
}

export async function countPendingInviteSignupsForEvent(eventId: string) {
  return prisma.trainingInviteSignup.count({
    where: {
      status: TRAINING_INVITE_SIGNUP_PENDING,
      invite: { eventId, status: TRAINING_INVITE_ACTIVE },
    },
  });
}

function isInviteRegistrationOpen(event: { startDate: Date }, invite: { status: string }) {
  if (invite.status !== TRAINING_INVITE_ACTIVE) return false;
  return event.startDate.getTime() > Date.now();
}

/** Squad players attending a training event (excludes coaches and invite guests). */
async function listSquadMembersAttendingEvent(
  eventId: string,
  trainingTeamKey: string,
): Promise<Array<{ id: string; displayName: string }>> {
  const teammates = await prisma.clubMember.findMany({
    where: {
      trainingTeamKey,
      active: true,
      userId: { not: null },
      rosterRole: { not: "COACH" },
    },
    select: {
      userId: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const userIds = teammates
    .map((member) => member.userId)
    .filter((id): id is string => Boolean(id));

  if (userIds.length === 0) return [];

  const attending = await prisma.eventSignup.findMany({
    where: {
      eventId,
      userId: { in: userIds },
      status: { in: ["ATTENDING", "CONFIRMED"] },
    },
    select: { userId: true },
  });
  const attendingIds = new Set(attending.map((row) => row.userId));

  return teammates
    .filter((member) => member.userId && attendingIds.has(member.userId))
    .map((member) => ({
      id: member.userId!,
      displayName: member.user?.name ?? "Player",
    }));
}

export const getPublicTrainingInviteByToken = cache(async function getPublicTrainingInviteByToken(
  token: string,
  viewerEmail?: string | null,
): Promise<
  | {
      ok: true;
      invite: PublicTrainingInvite;
      viewerRegistered: boolean;
      viewerPendingApproval: boolean;
      viewerRejected: boolean;
      viewerDisplayName: string | null;
      viewerPaymentProofId: string | null;
    }
  | { ok: false; reason: "not_found" | "inactive" }
> {
  const invite = await prisma.trainingInvite.findUnique({
    where: { token },
    include: {
      event: {
        include: {
          trainingSession: {
            select: {
              trainingTeamKey: true,
              coach: true,
              description: true,
            },
          },
        },
      },
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

  if (!invite || !invite.event) {
    return { ok: false, reason: "not_found" };
  }

  if (invite.status !== TRAINING_INVITE_ACTIVE) {
    return { ok: false, reason: "inactive" };
  }

  const teamKey = invite.event.trainingSession?.trainingTeamKey ?? null;
  const team = teamKey ? await getTrainingTeamByKey(teamKey) : null;

  const normalizedViewerEmail = viewerEmail
    ? normalizeTrainingInviteEmail(viewerEmail)
    : null;

  const viewerSignup = normalizedViewerEmail
    ? invite.signups.find((signup) => signup.email === normalizedViewerEmail) ??
      null
    : null;

  const registrationOpen = isInviteRegistrationOpen(invite.event, invite);

  const trainingTeamKey = invite.event.trainingSession?.trainingTeamKey ?? null;
  const squadAttendees = trainingTeamKey
    ? await listSquadMembersAttendingEvent(invite.eventId, trainingTeamKey)
    : [];

  // Public page may show approved guests (names only) — never pending/rejected.
  const approvedGuestAttendees = invite.signups
    .filter((signup) => signup.status === TRAINING_INVITE_SIGNUP_APPROVED)
    .map((signup) => ({
      id: signup.id,
      displayName: signup.displayName,
    }));

  return {
    ok: true,
    invite: {
      token: invite.token,
      pricingType: invite.pricingType as TrainingInvitePricingType,
      sessionFeeEur: invite.sessionFeeEur,
      paymentUrl: invite.paymentUrl,
      title: invite.event.title,
      description:
        invite.event.trainingSession?.description ?? invite.event.description,
      startDate: invite.event.startDate.toISOString(),
      endDate: invite.event.endDate?.toISOString() ?? null,
      location: invite.event.location,
      teamName: team?.name ?? null,
      coachName: invite.event.trainingSession?.coach ?? null,
      active: true,
      registrationOpen,
      squadAttendees,
      approvedGuestAttendees,
    },
    viewerRegistered: viewerSignup?.status === TRAINING_INVITE_SIGNUP_APPROVED,
    viewerPendingApproval:
      viewerSignup?.status === TRAINING_INVITE_SIGNUP_PENDING,
    viewerRejected: viewerSignup?.status === TRAINING_INVITE_SIGNUP_REJECTED,
    viewerDisplayName: viewerSignup?.displayName ?? null,
    viewerPaymentProofId: viewerSignup?.paymentProof?.id ?? null,
  };
});

async function getOpenInviteForSignup(token: string) {
  const invite = await prisma.trainingInvite.findUnique({
    where: { token },
    include: { event: { select: { id: true, startDate: true, type: true } } },
  });

  if (!invite || !invite.event || invite.event.type !== "TRAINING") {
    return { ok: false as const, error: "This invite could not be found." };
  }

  if (!isInviteRegistrationOpen(invite.event, invite)) {
    return {
      ok: false as const,
      error: "Registration is closed for this invite.",
    };
  }

  return { ok: true as const, invite };
}

export async function registerForTrainingInvite(
  token: string,
  input: { email: string; displayName: string; paymentProofId?: string },
) {
  const inviteResult = await getOpenInviteForSignup(token);
  if (!inviteResult.ok) return inviteResult;

  const email = normalizeTrainingInviteEmail(input.email);
  const displayName = input.displayName.trim();
  const requiresProof = trainingInviteRequiresPaymentProof(inviteResult.invite);

  const existing = await prisma.trainingInviteSignup.findUnique({
    where: {
      inviteId_email: {
        inviteId: inviteResult.invite.id,
        email,
      },
    },
  });

  if (existing) {
    if (existing.status === TRAINING_INVITE_SIGNUP_APPROVED) {
      return {
        ok: false as const,
        error: "You're already registered for this session with that email.",
        code: "already_registered" as const,
        existingDisplayName: existing.displayName,
      };
    }

    if (existing.status === TRAINING_INVITE_SIGNUP_PENDING) {
      return {
        ok: false as const,
        error: "Your request is already awaiting approval.",
        code: "already_pending" as const,
        existingDisplayName: existing.displayName,
      };
    }

    if (requiresProof) {
      const resubmitProofId = input.paymentProofId?.trim();
      if (!resubmitProofId) {
        return {
          ok: false as const,
          error: TRAINING_INVITE_NEW_RECEIPT_REQUIRED,
          code: "payment_proof_required" as const,
        };
      }

      const oldLinkedProof = await prisma.trainingInvitePaymentProof.findFirst({
        where: { signupId: existing.id },
        select: { id: true },
      });

      if (oldLinkedProof && resubmitProofId === oldLinkedProof.id) {
        return {
          ok: false as const,
          error: TRAINING_INVITE_NEW_RECEIPT_REQUIRED,
          code: "payment_proof_reuse" as const,
        };
      }

      const oldProofUrls: string[] = [];

      try {
        const signup = await prisma.$transaction(async (tx) => {
          const newProof = await tx.trainingInvitePaymentProof.findFirst({
            where: {
              id: resubmitProofId,
              inviteId: inviteResult.invite.id,
              signupId: null,
            },
          });

          if (!newProof) {
            throw new Error("payment_proof_invalid");
          }

          const oldProofs = await tx.trainingInvitePaymentProof.findMany({
            where: { signupId: existing.id },
          });

          for (const oldProof of oldProofs) {
            oldProofUrls.push(oldProof.proofScreenshotUrl);
            await tx.trainingInvitePaymentProof.delete({
              where: { id: oldProof.id },
            });
          }

          await tx.trainingInvitePaymentProof.update({
            where: { id: newProof.id },
            data: { signupId: existing.id },
          });

          return tx.trainingInviteSignup.update({
            where: { id: existing.id },
            data: {
              displayName,
              status: TRAINING_INVITE_SIGNUP_PENDING,
              reviewedAt: null,
              reviewedByUserId: null,
            },
          });
        });

        for (const proofUrl of oldProofUrls) {
          await deleteTrainingInvitePaymentProofFile(proofUrl);
        }

        return {
          ok: true as const,
          signup: serializeSignup({
            ...signup,
            invite: { pricingType: inviteResult.invite.pricingType },
          }),
          resubmitted: true as const,
        };
      } catch (error) {
        if (error instanceof Error && error.message === "payment_proof_invalid") {
          return {
            ok: false as const,
            error: TRAINING_INVITE_NEW_RECEIPT_REQUIRED,
            code: "payment_proof_invalid" as const,
          };
        }
        throw error;
      }
    }

    const signup = await prisma.trainingInviteSignup.update({
      where: { id: existing.id },
      data: {
        displayName,
        status: TRAINING_INVITE_SIGNUP_PENDING,
        reviewedAt: null,
        reviewedByUserId: null,
      },
    });

    return {
      ok: true as const,
      signup: serializeSignup({
        ...signup,
        invite: { pricingType: inviteResult.invite.pricingType },
      }),
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
    const proof = await prisma.trainingInvitePaymentProof.findFirst({
      where: {
        id: input.paymentProofId!.trim(),
        inviteId: inviteResult.invite.id,
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
        const proof = await tx.trainingInvitePaymentProof.findFirst({
          where: {
            id: input.paymentProofId!.trim(),
            inviteId: inviteResult.invite.id,
            signupId: null,
          },
        });

        if (!proof) {
          throw new Error("payment_proof_invalid");
        }
      }

      const created = await tx.trainingInviteSignup.create({
        data: {
          inviteId: inviteResult.invite.id,
          email,
          displayName,
          status: TRAINING_INVITE_SIGNUP_PENDING,
        },
      });

      if (requiresProof) {
        const linked = await tx.trainingInvitePaymentProof.updateMany({
          where: {
            id: input.paymentProofId!.trim(),
            inviteId: inviteResult.invite.id,
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
      const raced = await prisma.trainingInviteSignup.findUnique({
        where: {
          inviteId_email: {
            inviteId: inviteResult.invite.id,
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
    signup: serializeSignup({
      ...signup,
      invite: { pricingType: inviteResult.invite.pricingType },
    }),
    resubmitted: false as const,
  };
}

export async function setTrainingInviteSignupStatus(input: {
  signupId: string;
  status: TrainingInviteSignupStatus;
  reviewedByUserId: string;
  eventId?: string;
}) {
  const signup = await prisma.trainingInviteSignup.findUnique({
    where: { id: input.signupId },
    include: {
      invite: { select: { id: true, eventId: true, pricingType: true } },
      paymentProof: { select: { proofScreenshotUrl: true } },
    },
  });

  if (!signup) {
    return { ok: false as const, error: "Registration not found." };
  }

  if (input.eventId && signup.invite.eventId !== input.eventId) {
    return { ok: false as const, error: "Registration not found." };
  }

  if (signup.status === input.status) {
    return {
      ok: true as const,
      signup: serializeSignup(signup),
      unchanged: true as const,
    };
  }

  const updated = await prisma.trainingInviteSignup.update({
    where: { id: signup.id },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      reviewedByUserId: input.reviewedByUserId,
    },
    include: {
      invite: { select: { pricingType: true } },
      paymentProof: { select: { proofScreenshotUrl: true } },
    },
  });

  return {
    ok: true as const,
    signup: serializeSignup(updated),
    unchanged: false as const,
  };
}

/** Coach/admin removes a guest registration (pending or approved). */
export async function removeTrainingInviteSignup(input: {
  signupId: string;
  eventId?: string;
}) {
  const signup = await prisma.trainingInviteSignup.findUnique({
    where: { id: input.signupId },
    include: {
      invite: { select: { eventId: true } },
      paymentProof: { select: { id: true, proofScreenshotUrl: true } },
    },
  });

  if (!signup) {
    return { ok: false as const, error: "Registration not found." };
  }

  if (input.eventId && signup.invite.eventId !== input.eventId) {
    return { ok: false as const, error: "Registration not found." };
  }

  await prisma.trainingInviteSignup.delete({ where: { id: signup.id } });

  if (signup.paymentProof) {
    await prisma.trainingInvitePaymentProof.delete({
      where: { id: signup.paymentProof.id },
    }).catch(() => undefined);
    if (signup.paymentProof.proofScreenshotUrl) {
      await deleteTrainingInvitePaymentProofFile(
        signup.paymentProof.proofScreenshotUrl,
      );
    }
  }

  return { ok: true as const };
}

export async function createTrainingInvitePaymentProof(
  token: string,
  file: File,
) {
  const inviteResult = await getOpenInviteForSignup(token);
  if (!inviteResult.ok) return inviteResult;

  if (!trainingInviteRequiresPaymentProof(inviteResult.invite)) {
    return {
      ok: false as const,
      error: "This invite does not require a payment receipt.",
    };
  }

  const proof = await prisma.trainingInvitePaymentProof.create({
    data: {
      inviteId: inviteResult.invite.id,
      proofScreenshotUrl: "",
    },
  });

  try {
    const url = await saveTrainingInvitePaymentProofFile(proof.id, file);
    const updated = await prisma.trainingInvitePaymentProof.update({
      where: { id: proof.id },
      data: { proofScreenshotUrl: url },
    });

    return {
      ok: true as const,
      proof: {
        id: updated.id,
        proofScreenshotUrl: updated.proofScreenshotUrl,
        createdAt: updated.createdAt.toISOString(),
        removable: true,
      },
    };
  } catch (error) {
    await prisma.trainingInvitePaymentProof.delete({ where: { id: proof.id } });
    throw error;
  }
}

export async function getTrainingInvitePaymentProofStatus(
  token: string,
  proofId: string,
) {
  const invite = await prisma.trainingInvite.findUnique({
    where: { token },
    select: { id: true },
  });

  if (!invite) {
    return { ok: false as const, error: "Invite not found." };
  }

  const proof = await prisma.trainingInvitePaymentProof.findFirst({
    where: { id: proofId, inviteId: invite.id },
  });

  if (!proof || !proof.proofScreenshotUrl) {
    return { ok: false as const, error: "Payment receipt not found." };
  }

  return {
    ok: true as const,
    proof: {
      id: proof.id,
      proofScreenshotUrl: proof.proofScreenshotUrl,
      createdAt: proof.createdAt.toISOString(),
      removable: !proof.signupId,
    },
  };
}

export async function removeTrainingInvitePaymentProof(
  token: string,
  proofId: string,
) {
  const inviteResult = await getOpenInviteForSignup(token);
  if (!inviteResult.ok) return inviteResult;

  const proof = await prisma.trainingInvitePaymentProof.findFirst({
    where: {
      id: proofId,
      inviteId: inviteResult.invite.id,
      signupId: null,
    },
  });

  if (!proof) {
    return { ok: false as const, error: "Payment receipt not found." };
  }

  await prisma.trainingInvitePaymentProof.delete({ where: { id: proof.id } });
  if (proof.proofScreenshotUrl) {
    await deleteTrainingInvitePaymentProofFile(proof.proofScreenshotUrl);
  }

  return { ok: true as const };
}

export async function getTrainingInviteEventTeamKey(eventId: string) {
  const event = await getTrainingEventForInvite(eventId);
  return event?.trainingSession?.trainingTeamKey ?? null;
}

export async function getSignupInviteEventTeamKey(signupId: string) {
  const signup = await prisma.trainingInviteSignup.findUnique({
    where: { id: signupId },
    include: {
      invite: {
        include: {
          event: {
            include: {
              trainingSession: { select: { trainingTeamKey: true } },
            },
          },
        },
      },
    },
  });

  return {
    signup,
    trainingTeamKey:
      signup?.invite.event.trainingSession?.trainingTeamKey ?? null,
    eventId: signup?.invite.eventId ?? null,
  };
}
