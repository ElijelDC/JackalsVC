import { startOfDay } from "date-fns";

export function adminPendingPaymentWhere() {
  return {
    status: "PENDING" as const,
    proofSubmittedAt: { not: null },
    proofScreenshotUrl: { not: null },
  };
}

export function paymentHasUploadedProof(payment: {
  proofSubmittedAt: Date | string | null;
  proofScreenshotUrl: string | null;
}) {
  return Boolean(payment.proofSubmittedAt && payment.proofScreenshotUrl);
}

export type PendingPaymentDueState = "overdue" | "upcoming";

export function getPendingPaymentDueState(
  dueDate: string | null,
  now = new Date(),
): PendingPaymentDueState {
  if (!dueDate) return "upcoming";

  const due = new Date(dueDate);
  return due < startOfDay(now) ? "overdue" : "upcoming";
}
