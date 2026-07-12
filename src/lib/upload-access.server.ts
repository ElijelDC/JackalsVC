import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyRegistrationToken } from "@/lib/registration-token";

const PUBLIC_UPLOAD_PREFIXES = [
  "gallery/",
  "achievements/",
  "profile-images/",
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
      member &&
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

  // Unknown upload folder — deny by default.
  return false;
}

export function isSensitiveUploadPath(relativePath: string): boolean {
  return !isPublicUploadPath(relativePath);
}
