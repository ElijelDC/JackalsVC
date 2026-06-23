import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

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
  overrideUntil: Date | null;
  overduePayment: {
    amount: number;
    dueDate: Date;
    installmentNumber: number | null;
  } | null;
  daysPastDue: number;
  graceDaysRemaining: number | null;
};

export type MembershipSubscriptionFilter =
  | "all"
  | "active"
  | "coach"
  | "expired"
  | "overridden"
  | "overdue"
  | "cancelled";

export function isInstallmentSchedule(schedule: string): boolean {
  return schedule === "MONTHLY" || schedule === "INSTALLMENTS";
}

export function isPaymentOverdueOverrideActive(input: {
  paymentOverdueOverride: boolean;
  paymentOverdueOverrideUntil?: Date | string | null;
  now?: Date;
}): boolean {
  if (!input.paymentOverdueOverride) return false;

  if (!input.paymentOverdueOverrideUntil) {
    return true;
  }

  const until = new Date(input.paymentOverdueOverrideUntil);
  const now = input.now ?? new Date();
  return startOfDay(until).getTime() >= startOfDay(now).getTime();
}

export function assessMembershipPaymentAccess(input: {
  membershipStatus: string;
  paymentSchedule: string;
  paymentOverdueOverride: boolean;
  paymentOverdueOverrideUntil?: Date | string | null;
  payments: PaymentForAccess[];
  now?: Date;
}): MembershipPaymentAccess {
  const now = input.now ?? new Date();
  const overrideActive = isPaymentOverdueOverrideActive({
    paymentOverdueOverride: input.paymentOverdueOverride,
    paymentOverdueOverrideUntil: input.paymentOverdueOverrideUntil,
    now,
  });
  const overrideUntil = input.paymentOverdueOverrideUntil
    ? new Date(input.paymentOverdueOverrideUntil)
    : null;

  const base: MembershipPaymentAccess = {
    canAccessTrainingAndMatches: false,
    isOverdue: false,
    isPastDue: false,
    hasOverride: overrideActive,
    overrideUntil,
    overduePayment: null,
    daysPastDue: 0,
    graceDaysRemaining: null,
  };

  if (input.membershipStatus === "COACH") {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
    };
  }

  if (input.membershipStatus !== "ACTIVE") {
    return base;
  }

  if (!isInstallmentSchedule(input.paymentSchedule)) {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
    };
  }

  if (overrideActive) {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
      hasOverride: true,
      overrideUntil,
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
      overrideUntil: null,
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
    overrideUntil: null,
    overduePayment,
    daysPastDue,
    graceDaysRemaining: 0,
  };
}

export function matchesMembershipSubscriptionFilter(
  membership: {
    status: string;
    paymentSchedule: string;
    paymentOverdueOverride: boolean;
    paymentOverdueOverrideUntil?: Date | string | null;
    payments: PaymentForAccess[];
  },
  filter: MembershipSubscriptionFilter,
  now = new Date(),
): boolean {
  if (filter === "all") return true;

  if (filter === "active") {
    return membership.status === "ACTIVE";
  }

  if (filter === "coach") {
    return membership.status === "COACH";
  }

  if (filter === "expired") {
    return membership.status === "EXPIRED";
  }

  if (filter === "cancelled") {
    return membership.status === "CANCELLED";
  }

  if (filter === "overridden") {
    return isPaymentOverdueOverrideActive({
      paymentOverdueOverride: membership.paymentOverdueOverride,
      paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil,
      now,
    });
  }

  if (filter === "overdue") {
    const access = assessMembershipPaymentAccess({
      membershipStatus: membership.status,
      paymentSchedule: membership.paymentSchedule,
      paymentOverdueOverride: membership.paymentOverdueOverride,
      paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil,
      payments: membership.payments,
      now,
    });

    return (
      membership.status === "ACTIVE" &&
      isInstallmentSchedule(membership.paymentSchedule) &&
      access.isOverdue
    );
  }

  return true;
}
