import { formatEuroFee } from "@/lib/utils";

export type MembershipPricing = {
  seasonTotalPrice: number;
  durationMonths: number;
};

export function createMembershipPricing(
  seasonTotalPrice: number,
  durationMonths: number,
): MembershipPricing {
  return { seasonTotalPrice, durationMonths };
}

/** Default pricing when no plan is loaded (matches seed data). */
export const DEFAULT_MEMBERSHIP_PRICING = createMembershipPricing(420, 7);

export const PAYMENT_SCHEDULES = ["MONTHLY", "INSTALLMENTS", "FULL"] as const;
export type PaymentSchedule = (typeof PAYMENT_SCHEDULES)[number];

export type PaymentScheduleOption = {
  id: PaymentSchedule;
  label: string;
  description: string;
  summary: string;
};

export const CLUB_MEMBERSHIP_SEASON_LABEL =
  "for the full 2026/27 Irish National League";

export const CLUB_MEMBERSHIP_PLAN_NAME = "Club Membership 2026/27";

export const MEMBERSHIP_FEATURES = [
  "Training Sessions",
  "Full Club Kit",
  "League Matchdays",
  "Merchandise Discounts",
];

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
        label: "October",
        description: "First Monday of October",
        dueDate: (referenceDate) => installmentDueDates(referenceDate)[0]!,
      },
      {
        monthsCovered: 2,
        label: "January",
        description: "First Monday of January",
        dueDate: (referenceDate) => installmentDueDates(referenceDate)[1]!,
      },
      {
        monthsCovered: 2,
        label: "March",
        description: "First Monday of March",
        dueDate: (referenceDate) => installmentDueDates(referenceDate)[2]!,
      },
    ],
    FULL: [
      {
        monthsCovered: pricing.durationMonths,
        monthsUntilDue: 0,
        label: "Full membership payment",
      },
    ],
  };
}

function monthlyAmounts(pricing: MembershipPricing): number[] {
  const weights = [
    2,
    ...Array.from({ length: pricing.durationMonths - 1 }, () => 1),
  ];
  return proportionalAmounts(pricing.seasonTotalPrice, weights);
}

/** Standard monthly rate after the first (double) payment. */
export function getMonthlyRecurringAmount(pricing: MembershipPricing): number {
  const amounts = monthlyAmounts(pricing);
  return amounts[1] ?? amounts[0] ?? 0;
}

export function getMonthlyFirstAmount(pricing: MembershipPricing): number {
  return monthlyAmounts(pricing)[0] ?? 0;
}

export function validateMembershipPlanPrice(
  price: number,
  _durationMonths: number,
): string | null {
  if (price <= 0) {
    return "Membership price must be greater than zero.";
  }
  return null;
}

export function getPaymentScheduleOptions(
  pricing: MembershipPricing,
): PaymentScheduleOption[] {
  const remainingMonths = pricing.durationMonths - 1;
  const firstAmount = getMonthlyFirstAmount(pricing);
  const recurringAmount = getMonthlyRecurringAmount(pricing);

  return [
    {
      id: "MONTHLY",
      label: "Monthly",
      description: `First month is ${formatEuroFee(firstAmount)}, then ${formatEuroFee(recurringAmount)} per month for the remaining ${remainingMonths} months`,
      summary: `Then ${formatEuroFee(recurringAmount)}/mo for ${remainingMonths} months`,
    },
    {
      id: "INSTALLMENTS",
      label: "3 payments",
      description:
        "Three instalments due on the first Monday of October, January, and March",
      summary: "Oct · Jan · Mar",
    },
    {
      id: "FULL",
      label: "Pay in full",
      description: `One upfront payment for the entire ${pricing.durationMonths}-month membership`,
      summary: "Pay once · best value",
    },
  ];
}

export type GeneratedInstallment = {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  description: string;
  monthsCovered: number;
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
      : proportionalAmounts(
          pricing.seasonTotalPrice,
          templates.map((template) => template.monthsCovered),
        );

  return templates.map((template, index) => {
    const dueDate =
      template.dueDate?.(startDate) ??
      addMonths(startDate, template.monthsUntilDue ?? 0);

    const detail =
      template.description ??
      `${template.label} · ${template.monthsCovered} month${template.monthsCovered > 1 ? "s" : ""}`;

    return {
      installmentNumber: index + 1,
      amount: amounts[index]!,
      dueDate,
      description: detail,
      monthsCovered: template.monthsCovered,
    };
  });
}

export function getScheduleOption(
  schedule: PaymentSchedule,
  pricing: MembershipPricing = DEFAULT_MEMBERSHIP_PRICING,
) {
  return getPaymentScheduleOptions(pricing).find((option) => option.id === schedule)!;
}

export function formatPaymentScheduleLabel(schedule: PaymentSchedule): string {
  return getScheduleOption(schedule).label;
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
      return `${formatEuroFee(getMonthlyFirstAmount(pricing))} first month`;
    case "INSTALLMENTS":
      return `${formatEuroFee(getFirstInstallmentAmount(schedule, pricing))} first payment`;
    case "FULL":
      return `${formatEuroFee(pricing.seasonTotalPrice)} upfront`;
    default:
      return formatEuroFee(getFirstInstallmentAmount(schedule, pricing));
  }
}
