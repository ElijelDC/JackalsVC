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
  /** Session already started and counts toward pay (not can't-attend / cancelled). */
  payable: boolean;
  /** Upcoming session that will count toward pay unless marked can't attend. */
  expected: boolean;
  amount: number;
  trainingTeamKey?: string | null;
  teamName?: string | null;
};

export type CoachMonthPayrollBreakdown = {
  sessions: CoachTrainingPayItem[];
  billableCount: number;
  expectedCount: number;
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
  trainingTeamKeys: string[];
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
  if (item.expected) return "Expected";
  if (item.coachStatus === "ATTENDING") return "Attended";
  return "Payable";
}

export type CoachPayTeamGroup = {
  key: string;
  name: string;
  sessions: CoachTrainingPayItem[];
  billableCount: number;
  expectedCount: number;
  cantAttendCount: number;
  cancelledCount: number;
  amount: number;
};

export function groupCoachPaySessionsByTeam(
  sessions: CoachTrainingPayItem[],
): CoachPayTeamGroup[] {
  const groups = new Map<string, CoachPayTeamGroup>();

  for (const item of sessions) {
    const key = item.trainingTeamKey || item.teamName || "team";
    const name = item.teamName || item.trainingTeamKey || "Squad";
    const existing = groups.get(key);
    if (existing) {
      existing.sessions.push(item);
      if (item.payable) existing.billableCount += 1;
      if (item.expected) existing.expectedCount += 1;
      if (!item.cancelled && item.coachStatus === "NOT_ATTENDING") {
        existing.cantAttendCount += 1;
      }
      if (item.cancelled) existing.cancelledCount += 1;
      existing.amount += item.amount;
    } else {
      groups.set(key, {
        key,
        name,
        sessions: [item],
        billableCount: item.payable ? 1 : 0,
        expectedCount: item.expected ? 1 : 0,
        cantAttendCount:
          !item.cancelled && item.coachStatus === "NOT_ATTENDING" ? 1 : 0,
        cancelledCount: item.cancelled ? 1 : 0,
        amount: item.amount,
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Sessions that should drive the month's payment / projection amount. */
export function coachPaymentBillableSessionCount(
  breakdown: CoachMonthPayrollBreakdown,
  year: number,
  month: number,
  now: Date = new Date(),
) {
  if (isFuturePaymentMonth(year, month, now)) {
    return breakdown.expectedCount;
  }
  return breakdown.billableCount;
}

function appendBreakdownParts(
  parts: string[],
  breakdown: CoachMonthPayrollBreakdown,
) {
  if (breakdown.expectedCount > 0) {
    parts.push(`${breakdown.expectedCount} upcoming`);
  }
  if (breakdown.cantAttendCount > 0) {
    parts.push(`${breakdown.cantAttendCount} can't attend`);
  }
  if (breakdown.cancelledCount > 0) {
    parts.push(`${breakdown.cancelledCount} cancelled`);
  }
}

/** Dashboard / card one-liner, e.g. "0 payable trainings × €25 · 1 upcoming · 8 can't attend". */
export function formatCoachPaymentBreakdownSummary(
  breakdown: CoachMonthPayrollBreakdown,
  formattedRate: string,
): string {
  const parts = [
    `${breakdown.billableCount} payable training${breakdown.billableCount === 1 ? "" : "s"} × ${formattedRate}`,
  ];
  appendBreakdownParts(parts, breakdown);
  return parts.join(" · ");
}

/** Shorter variant without rate, e.g. "3 payable · 1 upcoming · 2 can't attend". */
export function formatCoachPaymentBreakdownShort(
  breakdown: CoachMonthPayrollBreakdown,
): string {
  const parts = [`${breakdown.billableCount} payable`];
  appendBreakdownParts(parts, breakdown);
  return parts.join(" · ");
}
