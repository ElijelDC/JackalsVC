import { addDays, differenceInCalendarDays } from "date-fns";

export const PAYMENT_OVERDUE_GRACE_DAYS = 14;

export type PaymentForAccess = {
  status: string;
  dueDate: Date | string | null;
  amount: number;
  installmentNumber: number | null;
};

export type MembershipPaymentAccess = {
  canAccessTrainingAndMatches: boolean;
  isOverdue: boolean;
  isPastDue: boolean;
  hasOverride: boolean;
  overduePayment: {
    amount: number;
    dueDate: Date;
    installmentNumber: number | null;
  } | null;
  daysPastDue: number;
  graceDaysRemaining: number | null;
};

export function isInstallmentSchedule(schedule: string): boolean {
  return schedule === "MONTHLY" || schedule === "INSTALLMENTS";
}

export function assessMembershipPaymentAccess(input: {
  membershipStatus: string;
  paymentSchedule: string;
  paymentOverdueOverride: boolean;
  payments: PaymentForAccess[];
  now?: Date;
}): MembershipPaymentAccess {
  const now = input.now ?? new Date();
  const base: MembershipPaymentAccess = {
    canAccessTrainingAndMatches: false,
    isOverdue: false,
    isPastDue: false,
    hasOverride: input.paymentOverdueOverride,
    overduePayment: null,
    daysPastDue: 0,
    graceDaysRemaining: null,
  };

  if (input.membershipStatus !== "ACTIVE") {
    return base;
  }

  if (!isInstallmentSchedule(input.paymentSchedule)) {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
    };
  }

  if (input.paymentOverdueOverride) {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
      hasOverride: true,
    };
  }

  const pendingWithDue = input.payments
    .filter((payment) => payment.status === "PENDING" && payment.dueDate)
    .map((payment) => ({
      ...payment,
      dueDate: new Date(payment.dueDate!),
    }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const earliestPastDue = pendingWithDue.find((payment) => payment.dueDate < now);

  if (!earliestPastDue) {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
    };
  }

  const graceEnd = addDays(earliestPastDue.dueDate, PAYMENT_OVERDUE_GRACE_DAYS);
  const daysPastDue = Math.max(
    0,
    differenceInCalendarDays(now, earliestPastDue.dueDate),
  );
  const overduePayment = {
    amount: earliestPastDue.amount,
    dueDate: earliestPastDue.dueDate,
    installmentNumber: earliestPastDue.installmentNumber,
  };

  if (now < graceEnd) {
    return {
      canAccessTrainingAndMatches: true,
      isOverdue: false,
      isPastDue: true,
      hasOverride: false,
      overduePayment,
      daysPastDue,
      graceDaysRemaining: differenceInCalendarDays(graceEnd, now),
    };
  }

  return {
    canAccessTrainingAndMatches: false,
    isOverdue: true,
    isPastDue: true,
    hasOverride: false,
    overduePayment,
    daysPastDue,
    graceDaysRemaining: 0,
  };
}
