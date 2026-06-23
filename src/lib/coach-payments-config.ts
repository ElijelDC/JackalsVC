import type { TrainingAttendanceStatus } from "@/lib/training-attendance-config";

export const COACH_SESSION_RATE_EUR = 25;

export const COACH_PAYMENT_STATUSES = ["PENDING", "PAID"] as const;

export type CoachPaymentStatus = (typeof COACH_PAYMENT_STATUSES)[number];

export const COACH_PAYMENT_STATUS_LABELS: Record<CoachPaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
};

export type CoachTrainingPayItem = {
  eventId: string;
  startDate: string;
  location: string | null;
  cancelled: boolean;
  coachStatus: TrainingAttendanceStatus | "CANCELLED";
  payable: boolean;
  amount: number;
};

export type CoachMonthPayrollBreakdown = {
  sessions: CoachTrainingPayItem[];
  billableCount: number;
  cantAttendCount: number;
  cancelledCount: number;
  totalScheduled: number;
};

export type CoachPaymentItem = {
  id: string;
  year: number;
  month: number;
  sessionCount: number;
  ratePerSession: number;
  amount: number;
  status: CoachPaymentStatus;
  invoiceScreenshotUrl: string | null;
  paidAt: string | null;
  notes: string | null;
  breakdown: CoachMonthPayrollBreakdown;
};

export type AdminCoachPaymentRow = {
  clubMemberId: string;
  name: string;
  email: string | null;
  trainingTeamKey: string | null;
  teamName: string | null;
  payments: CoachPaymentItem[];
};

export function calculateCoachSalaryAmount(
  sessionCount: number,
  ratePerSession: number = COACH_SESSION_RATE_EUR,
) {
  return sessionCount * ratePerSession;
}

export function formatCoachPaymentMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function coachPaymentMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isCurrentPaymentMonth(year: number, month: number, now = new Date()) {
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

export function isPastPaymentMonth(year: number, month: number, now = new Date()) {
  const current = now.getFullYear() * 12 + now.getMonth();
  const target = year * 12 + (month - 1);
  return target < current;
}

export function isFuturePaymentMonth(year: number, month: number, now = new Date()) {
  const current = now.getFullYear() * 12 + now.getMonth();
  const target = year * 12 + (month - 1);
  return target > current;
}

/** At least one training occurred (payable or can't attend — not empty/cancelled-only). */
export function hasCompletedCoachWork(payment: CoachPaymentItem) {
  const { breakdown } = payment;
  return breakdown.billableCount > 0 || breakdown.cantAttendCount > 0;
}

/** Past month, marked paid, with real sessions — not an empty ghost record. */
export function isSettledCoachPayment(payment: CoachPaymentItem, now = new Date()) {
  return (
    isPastPaymentMonth(payment.year, payment.month, now) &&
    payment.status === "PAID" &&
    hasCompletedCoachWork(payment)
  );
}

/** Past month still owed — sessions happened but payment not marked paid. */
export function isOverdueCoachPayment(payment: CoachPaymentItem, now = new Date()) {
  return (
    isPastPaymentMonth(payment.year, payment.month, now) &&
    payment.status === "PENDING" &&
    payment.amount > 0 &&
    hasCompletedCoachWork(payment)
  );
}

/** Coaches only see the transfer screenshot once the club has marked the month paid. */
export function coachCanViewPaymentConfirmation(payment: CoachPaymentItem) {
  return payment.status === "PAID" && Boolean(payment.invoiceScreenshotUrl);
}

export function maskCoachPaymentForCoachView(
  payment: CoachPaymentItem,
): CoachPaymentItem {
  if (coachCanViewPaymentConfirmation(payment)) return payment;
  return { ...payment, invoiceScreenshotUrl: null };
}

export function maskCoachPaymentsForCoachView(
  payments: CoachPaymentItem[],
): CoachPaymentItem[] {
  return payments.map(maskCoachPaymentForCoachView);
}

export function coachTrainingPayItemLabel(
  item: CoachTrainingPayItem,
  now: Date = new Date(),
) {
  if (item.cancelled) return "Cancelled";
  if (item.coachStatus === "NOT_ATTENDING") return "Can't attend";
  if (new Date(item.startDate) < now) return "Attended";
  return "Expected";
}
