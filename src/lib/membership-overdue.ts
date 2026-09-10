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
  | "cancelled"
  | "arrears";

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

/** Payment-based past-due / past-grace state (ignores membership status). */
export function assessInstallmentPaymentState(input: {
  paymentSchedule: string;
  payments: PaymentForAccess[];
  now?: Date;
}): Pick<
  MembershipPaymentAccess,
  | "isOverdue"
  | "isPastDue"
  | "overduePayment"
  | "daysPastDue"
  | "graceDaysRemaining"
> {
  const now = input.now ?? new Date();
  const empty = {
    isOverdue: false,
    isPastDue: false,
    overduePayment: null,
    daysPastDue: 0,
    graceDaysRemaining: null,
  };

  if (!isInstallmentSchedule(input.paymentSchedule)) {
    return empty;
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
    return empty;
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
      isOverdue: false,
      isPastDue: true,
      overduePayment,
      daysPastDue,
      graceDaysRemaining: differenceInCalendarDays(graceEnd, now),
    };
  }

  return {
    isOverdue: true,
    isPastDue: true,
    overduePayment,
    daysPastDue,
    graceDaysRemaining: 0,
  };
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

  const installment = assessInstallmentPaymentState({
    paymentSchedule: input.paymentSchedule,
    payments: input.payments,
    now,
  });

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

  // Explicit arrears status: blocked unless admin override is active.
  if (input.membershipStatus === "ARREARS") {
    return {
      ...base,
      ...installment,
      isOverdue: true,
      isPastDue: true,
      canAccessTrainingAndMatches: overrideActive,
      hasOverride: overrideActive,
      overrideUntil,
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
      ...installment,
      canAccessTrainingAndMatches: true,
      hasOverride: true,
      overrideUntil,
    };
  }

  if (!installment.isPastDue) {
    return {
      ...base,
      canAccessTrainingAndMatches: true,
    };
  }

  if (!installment.isOverdue) {
    return {
      ...base,
      ...installment,
      canAccessTrainingAndMatches: true,
    };
  }

  return {
    ...base,
    ...installment,
    canAccessTrainingAndMatches: false,
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

  if (filter === "arrears") {
    return membership.status === "ARREARS";
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
      (membership.status === "ACTIVE" || membership.status === "ARREARS") &&
      access.isOverdue
    );
  }

  return true;
}
