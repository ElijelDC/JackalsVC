import { formatEuroFee } from "@/lib/utils";
import { MEMBERSHIP_INCLUDES } from "@/lib/membership-2026-27";

export type MembershipInstallmentAmounts = [number, number, number];

export type MembershipPricing = {
  seasonTotalPrice: number;
  durationMonths: number;
  installmentAmounts?: MembershipInstallmentAmounts | null;
};

export function createMembershipPricing(
  seasonTotalPrice: number,
  durationMonths: number,
  installmentAmounts?: MembershipInstallmentAmounts | null,
): MembershipPricing {
  return {
    seasonTotalPrice,
    durationMonths,
    installmentAmounts: installmentAmounts ?? null,
  };
}

export function planInstallmentAmounts(plan: {
  installment1Eur?: number | null;
  installment2Eur?: number | null;
  installment3Eur?: number | null;
}): MembershipInstallmentAmounts | null {
  const amounts = [
    plan.installment1Eur,
    plan.installment2Eur,
    plan.installment3Eur,
  ];
  if (amounts.every((amount) => typeof amount === "number" && Number.isFinite(amount))) {
    return amounts as MembershipInstallmentAmounts;
  }
  return null;
}

export const CLUB_MEMBERSHIP_SEASON_LABEL =
  "for the full 2026/27 Irish National League";

export const CLUB_MEMBERSHIP_PLAN_NAME = "Club Membership 2026/27";

export const MEMBERSHIP_PLAN_ADULT_NAME = "Adult";
export const MEMBERSHIP_PLAN_STUDENT_NAME = "Student / U18";
export const MEMBERSHIP_PLAN_ADULT_PRICE = 450;
export const MEMBERSHIP_PLAN_STUDENT_PRICE = 385;
export const MEMBERSHIP_PLAN_DURATION_MONTHS = 7;

/** All 2026/27 club memberships end mid-May 2027. */
export const CLUB_MEMBERSHIP_SEASON_END_DATE = new Date(2027, 4, 15, 23, 59, 59, 999);

export function getClubMembershipSeasonEndDate() {
  return new Date(CLUB_MEMBERSHIP_SEASON_END_DATE);
}

/** Checkout “what’s included” — kept in sync with the public 2026/27 page. */
export const MEMBERSHIP_FEATURES = [...MEMBERSHIP_INCLUDES];

/** Default pricing when no plan is loaded (adult tier). */
export const DEFAULT_MEMBERSHIP_PRICING = createMembershipPricing(
  MEMBERSHIP_PLAN_ADULT_PRICE,
  MEMBERSHIP_PLAN_DURATION_MONTHS,
);

/** Schedules members can choose at checkout. */
export const CHECKOUT_PAYMENT_SCHEDULES = ["INSTALLMENTS", "FULL"] as const;
export type CheckoutPaymentSchedule = (typeof CHECKOUT_PAYMENT_SCHEDULES)[number];

/** Includes legacy MONTHLY for existing memberships. */
export const PAYMENT_SCHEDULES = ["MONTHLY", "INSTALLMENTS", "FULL"] as const;
export type PaymentSchedule = (typeof PAYMENT_SCHEDULES)[number];

export type PaymentScheduleOption = {
  id: CheckoutPaymentSchedule;
  label: string;
  description: string;
  summary: string;
};

type InstallmentTemplate = {
  monthsCovered: number;
  monthsUntilDue?: number;
  dueDate?: (referenceDate: Date) => Date;
  label: string;
  description?: string;
};

function proportionalAmounts(total: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let allocated = 0;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) {
      return Math.round((total - allocated) * 100) / 100;
    }

    const amount = Math.floor(((total * weight) / totalWeight) * 100) / 100;
    allocated += amount;
    return amount;
  });
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function getSeasonYear(referenceDate = new Date()): number {
  return referenceDate.getFullYear();
}

export function firstMondayOfMonth(year: number, month: number): Date {
  const date = new Date(year, month, 1);
  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  date.setDate(1 + daysToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function installmentDueDates(referenceDate: Date): Date[] {
  const seasonYear = getSeasonYear(referenceDate);
  return [
    firstMondayOfMonth(seasonYear, 9),
    firstMondayOfMonth(seasonYear + 1, 0),
    firstMondayOfMonth(seasonYear + 1, 2),
  ];
}

const INSTALLMENT_WEIGHTS = [3, 2, 2] as const;

export function defaultInstallmentAmounts(
  seasonTotalPrice: number,
): MembershipInstallmentAmounts {
  const amounts = proportionalAmounts(seasonTotalPrice, [...INSTALLMENT_WEIGHTS]);
  return [amounts[0]!, amounts[1]!, amounts[2]!];
}

export function resolveInstallmentAmounts(
  pricing: MembershipPricing,
): MembershipInstallmentAmounts {
  if (
    pricing.installmentAmounts &&
    pricing.installmentAmounts.every((amount) => Number.isFinite(amount) && amount > 0)
  ) {
    return pricing.installmentAmounts;
  }
  return defaultInstallmentAmounts(pricing.seasonTotalPrice);
}

export function validateInstallmentAmounts(
  price: number,
  amounts: MembershipInstallmentAmounts,
): string | null {
  if (amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
    return "Each instalment must be greater than zero.";
  }

  const sum = Math.round((amounts[0] + amounts[1] + amounts[2]) * 100) / 100;
  const target = Math.round(price * 100) / 100;
  if (sum !== target) {
    return `The three instalments must add up to ${formatEuroFee(price)} (currently ${formatEuroFee(sum)}).`;
  }

  return null;
}

function getInstallmentTemplates(pricing: MembershipPricing): Record<
  PaymentSchedule,
  InstallmentTemplate[]
> {
  return {
    MONTHLY: Array.from({ length: pricing.durationMonths }, (_, index) => ({
      monthsCovered: 1,
      monthsUntilDue: index,
      label: index === 0 ? "First month" : `Month ${index + 1}`,
    })),
    INSTALLMENTS: [
      {
        monthsCovered: 3,
        label: "Instalment 1",
        description: "October",
        dueDate: (referenceDate) => installmentDueDates(referenceDate)[0]!,
      },
      {
        monthsCovered: 2,
        label: "Instalment 2",
        description: "January",
        dueDate: (referenceDate) => installmentDueDates(referenceDate)[1]!,
      },
      {
        monthsCovered: 2,
        label: "Instalment 3",
        description: "March",
        dueDate: (referenceDate) => installmentDueDates(referenceDate)[2]!,
      },
    ],
    FULL: [
      {
        monthsCovered: pricing.durationMonths,
        monthsUntilDue: 0,
        label: "Full payment",
        description: "Pay once upfront",
      },
    ],
  };
}

function monthlyAmounts(pricing: MembershipPricing): number[] {
  const weights = [
    2,
    ...Array.from({ length: Math.max(pricing.durationMonths - 1, 0) }, () => 1),
  ];
  return proportionalAmounts(pricing.seasonTotalPrice, weights);
}

export function validateMembershipPlanPrice(
  price: number,
  durationMonths: number,
): string | null {
  if (price <= 0) {
    return "Membership price must be greater than zero.";
  }
  if (durationMonths <= 0) {
    return "Membership duration must be at least one month.";
  }
  return null;
}

export function toPlanData(data: {
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  installment1Eur: number;
  installment2Eur: number;
  installment3Eur: number;
  active: boolean;
}) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    durationMonths: data.durationMonths,
    installment1Eur: data.installment1Eur,
    installment2Eur: data.installment2Eur,
    installment3Eur: data.installment3Eur,
    features: "[]",
    active: data.active,
  };
}

export function getPaymentScheduleOptions(
  pricing: MembershipPricing,
): PaymentScheduleOption[] {
  const [oct, jan, mar] = resolveInstallmentAmounts(pricing);

  return [
    {
      id: "INSTALLMENTS",
      label: "3 instalments",
      description: "Split the season into three payments",
      summary: `1: ${formatEuroFee(oct)} · 2: ${formatEuroFee(jan)} · 3: ${formatEuroFee(mar)}`,
    },
    {
      id: "FULL",
      label: "Pay in full",
      description: "One payment for the whole season",
      summary: formatEuroFee(pricing.seasonTotalPrice),
    },
  ];
}

export type GeneratedInstallment = {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  description: string;
  monthsCovered: number;
  label: string;
  periodLabel: string;
};

export function buildInstallments(
  schedule: PaymentSchedule,
  pricing: MembershipPricing = DEFAULT_MEMBERSHIP_PRICING,
  startDate = new Date(),
): GeneratedInstallment[] {
  const templates = getInstallmentTemplates(pricing)[schedule];
  const amounts =
    schedule === "MONTHLY"
      ? monthlyAmounts(pricing)
      : schedule === "INSTALLMENTS"
        ? resolveInstallmentAmounts(pricing)
        : [pricing.seasonTotalPrice];

  return templates.map((template, index) => {
    const dueDate =
      template.dueDate?.(startDate) ??
      addMonths(startDate, template.monthsUntilDue ?? 0);

    const detail =
      schedule === "INSTALLMENTS"
        ? `${template.label} · ${template.description ?? template.label}`
        : (template.description ??
          `${template.label} · ${template.monthsCovered} month${template.monthsCovered > 1 ? "s" : ""}`);

    return {
      installmentNumber: index + 1,
      amount: amounts[index]!,
      dueDate,
      description: detail,
      monthsCovered: template.monthsCovered,
      label: template.label,
      periodLabel: template.description ?? template.label,
    };
  });
}

export function getScheduleOption(
  schedule: PaymentSchedule,
  pricing: MembershipPricing = DEFAULT_MEMBERSHIP_PRICING,
): PaymentScheduleOption {
  if (schedule === "MONTHLY") {
    return {
      id: "INSTALLMENTS",
      label: "Monthly",
      description: "Legacy monthly schedule",
      summary: "Monthly",
    };
  }

  return (
    getPaymentScheduleOptions(pricing).find((option) => option.id === schedule) ??
    getPaymentScheduleOptions(pricing)[1]!
  );
}

export function formatPaymentScheduleLabel(schedule: PaymentSchedule): string {
  if (schedule === "MONTHLY") return "Monthly";
  return getScheduleOption(schedule).label;
}

export function formatPaymentScheduleShortLabel(schedule: PaymentSchedule): string {
  switch (schedule) {
    case "MONTHLY":
      return "Monthly";
    case "INSTALLMENTS":
      return "3 instalments";
    case "FULL":
      return "Full";
    default:
      return formatPaymentScheduleLabel(schedule);
  }
}

export function formatMembershipPlanShortName(planName: string): string {
  if (planName === MEMBERSHIP_PLAN_ADULT_NAME || planName === "Adult (full waged)") {
    return "Adult";
  }
  if (planName === MEMBERSHIP_PLAN_STUDENT_NAME) return "Student/U18";
  return planName.replace(/\s*\([^)]*\)/, "").trim() || planName;
}

export function formatMembershipSubscriptionLabel(
  planName: string,
  paymentSchedule: PaymentSchedule | string,
): string {
  const schedule = PAYMENT_SCHEDULES.includes(paymentSchedule as PaymentSchedule)
    ? (paymentSchedule as PaymentSchedule)
    : "FULL";

  return `${formatMembershipPlanShortName(planName)} - ${formatPaymentScheduleShortLabel(schedule)}`;
}

export function getFirstInstallmentAmount(
  schedule: PaymentSchedule,
  pricing: MembershipPricing = DEFAULT_MEMBERSHIP_PRICING,
): number {
  return buildInstallments(schedule, pricing)[0]?.amount ?? pricing.seasonTotalPrice;
}

export function getScheduleDueNowLabel(
  schedule: PaymentSchedule,
  pricing: MembershipPricing = DEFAULT_MEMBERSHIP_PRICING,
): string {
  switch (schedule) {
    case "MONTHLY":
      return `${formatEuroFee(monthlyAmounts(pricing)[0] ?? 0)} first month`;
    case "INSTALLMENTS":
      return `Instalment 1 · ${formatEuroFee(getFirstInstallmentAmount(schedule, pricing))}`;
    case "FULL":
      return `${formatEuroFee(pricing.seasonTotalPrice)} upfront`;
    default:
      return formatEuroFee(getFirstInstallmentAmount(schedule, pricing));
  }
}
