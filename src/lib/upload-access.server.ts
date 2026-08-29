import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyRegistrationToken } from "@/lib/registration-token";

const PUBLIC_UPLOAD_PREFIXES = [
  "gallery/",
  "achievements/",
  "profile-images/",
  "tournament-docs/",
  "tournament-winners/",
] as const;

function isPublicUploadPath(relativePath: string): boolean {
  return PUBLIC_UPLOAD_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

function extractIdFromFilename(relativePath: string, folder: string): string | null {
  const prefix = `${folder}/`;
  if (!relativePath.startsWith(prefix)) return null;
  const filename = relativePath.slice(prefix.length);
  const id = filename.split("-")[0];
  return id || null;
}

async function authorizePaymentProof(relativePath: string) {
  const paymentId = extractIdFromFilename(
    relativePath,
    "payment-proofs",
  );
  if (!paymentId) return false;

  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: session.user.id },
    select: { id: true },
  });
  return Boolean(payment);
}

async function authorizeCoachInvoice(relativePath: string) {
  const paymentId = extractIdFromFilename(
    relativePath,
    "coach-invoices",
  );
  if (!paymentId) return false;

  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;

  const coachPayment = await prisma.coachSalaryPayment.findUnique({
    where: { id: paymentId },
    select: {
      status: true,
      clubMember: { select: { userId: true } },
    },
  });

  if (!coachPayment || coachPayment.status !== "PAID") return false;
  return coachPayment.clubMember.userId === session.user.id;
}

async function authorizeVlyMembershipPhoto(
  relativePath: string,
  request: Request,
) {
  const parts = relativePath.split("/");
  const memberId = parts[1];
  if (!memberId || parts[0] !== "vly-membership-photos") return false;

  const url = new URL(request.url);
  const registrationToken = url.searchParams.get("rt");
  if (registrationToken) {
    const member = await prisma.clubMember.findUnique({
      where: { id: memberId },
      select: { vlyNumber: true },
    });
    if (
      member?.vlyNumber &&
      verifyRegistrationToken(registrationToken, member.vlyNumber).valid
    ) {
      return true;
    }
  }

  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;
  if (session.user.isCoach) return true;

  const clubMember = await prisma.clubMember.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return clubMember?.id === memberId;
}

async function authorizeTrialSessionPaymentProof(relativePath: string) {
  const prefix = "trial-session-proofs/";
  if (!relativePath.startsWith(prefix)) return false;

  const filename = relativePath.slice(prefix.length);
  const match = filename.match(/^([0-9a-f-]{36})-\d+\.[a-z0-9]+$/i);
  const proofId = match?.[1];
  if (!proofId) return false;

  const proof = await prisma.trialSessionPaymentProof.findUnique({
    where: { id: proofId },
    select: {
      id: true,
      trialSession: { select: { active: true } },
    },
  });
  if (!proof) return false;

  const session = await auth();
  if (session?.user?.role === "ADMIN") return true;

  // Public trial signup: the proof UUID in the filename acts as the access token.
  return proof.trialSession.active;
}

async function authorizeKitOrderProof(
  relativePath: string,
  request: Request,
) {
  const orderId = extractIdFromFilename(relativePath, "kit-order-proofs");
  if (!orderId) return false;

  const session = await auth();
  if (session?.user?.role === "ADMIN") return true;

  const paymentToken = new URL(request.url).searchParams.get("pt");
  if (!paymentToken?.trim()) return false;

  const order = await prisma.kitOrder.findFirst({
    where: { id: orderId, paymentToken: paymentToken.trim() },
    select: { id: true },
  });
  return Boolean(order);
}

async function authorizeMerchandiseOrderProof(
  relativePath: string,
  request: Request,
) {
  const orderId = extractIdFromFilename(
    relativePath,
    "merchandise-order-proofs",
  );
  if (!orderId) return false;
  const session = await auth();
  if (session?.user?.role === "ADMIN") return true;
  const paymentToken = new URL(request.url).searchParams.get("pt");
  if (!paymentToken?.trim()) return false;
  const order = await prisma.merchandiseOrder.findFirst({
    where: { id: orderId, paymentToken: paymentToken.trim() },
    select: { id: true },
  });
  return Boolean(order);
}

export async function authorizeUploadAccess(
  relativePath: string,
  request: Request,
): Promise<boolean> {
  if (isPublicUploadPath(relativePath)) {
    return true;
  }

  if (relativePath.startsWith("payment-proofs/")) {
    return authorizePaymentProof(relativePath);
  }

  if (relativePath.startsWith("coach-invoices/")) {
    return authorizeCoachInvoice(relativePath);
  }

  if (relativePath.startsWith("vly-membership-photos/")) {
    return authorizeVlyMembershipPhoto(relativePath, request);
  }

  if (relativePath.startsWith("trial-session-proofs/")) {
    return authorizeTrialSessionPaymentProof(relativePath);
  }

  if (relativePath.startsWith("kit-order-proofs/")) {
    return authorizeKitOrderProof(relativePath, request);
  }

  if (relativePath.startsWith("merchandise-order-proofs/")) {
    return authorizeMerchandiseOrderProof(relativePath, request);
  }

  if (relativePath.startsWith("admin-docs/")) {
    const session = await auth();
    return session?.user?.role === "ADMIN";
  }

  // Unknown upload folder — deny by default.
  return false;
}

export function isSensitiveUploadPath(relativePath: string): boolean {
  return !isPublicUploadPath(relativePath);
}
