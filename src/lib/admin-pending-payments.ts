import { startOfDay } from "date-fns";

export function adminPendingPaymentWhere(now = new Date()) {
  return {
    status: "PENDING" as const,
    proofSubmittedAt: { not: null },
    proofScreenshotUrl: { not: null },
    OR: [{ dueDate: null }, { dueDate: { lte: now } }],
  };
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
