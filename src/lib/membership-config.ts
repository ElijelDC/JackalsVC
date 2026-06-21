export const SEASON_DURATION_MONTHS = 7;
export const SEASON_TOTAL_PRICE = 400;

export const PAYMENT_SCHEDULES = ["MONTHLY", "INSTALLMENTS", "FULL"] as const;
export type PaymentSchedule = (typeof PAYMENT_SCHEDULES)[number];

export type PaymentScheduleOption = {
  id: PaymentSchedule;
  label: string;
  description: string;
  summary: string;
};

export const PAYMENT_SCHEDULE_OPTIONS: PaymentScheduleOption[] = [
  {
    id: "MONTHLY",
    label: "Monthly",
    description: "7 equal monthly payments across the season",
    summary: "7 × monthly instalments",
  },
  {
    id: "INSTALLMENTS",
    label: "3 payments",
    description: "Three instalments covering 3 + 2 + 2 months of the season",
    summary: "3 + 2 + 2 month blocks",
  },
  {
    id: "FULL",
    label: "Full season",
    description: "One upfront payment for the entire 7-month season",
    summary: "Pay once · best value",
  },
];

export const MEMBERSHIP_FEATURES = [
  "All training sessions",
  "Club tournaments and events",
  "Member shop discounts",
  "Squad selection eligibility",
];

type InstallmentTemplate = {
  monthsCovered: number;
  monthsUntilDue: number;
  label: string;
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

const INSTALLMENT_TEMPLATES: Record<PaymentSchedule, InstallmentTemplate[]> = {
  MONTHLY: Array.from({ length: SEASON_DURATION_MONTHS }, (_, index) => ({
    monthsCovered: 1,
    monthsUntilDue: index,
    label: `Month ${index + 1}`,
  })),
  INSTALLMENTS: [
    { monthsCovered: 3, monthsUntilDue: 0, label: "First block (3 months)" },
    { monthsCovered: 2, monthsUntilDue: 3, label: "Second block (2 months)" },
    { monthsCovered: 2, monthsUntilDue: 5, label: "Final block (2 months)" },
  ],
  FULL: [
    {
      monthsCovered: SEASON_DURATION_MONTHS,
      monthsUntilDue: 0,
      label: "Full season payment",
    },
  ],
};

export type GeneratedInstallment = {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  description: string;
  monthsCovered: number;
};

export function buildInstallments(
  schedule: PaymentSchedule,
  startDate = new Date(),
): GeneratedInstallment[] {
  const templates = INSTALLMENT_TEMPLATES[schedule];
  const weights = templates.map((template) => template.monthsCovered);
  const amounts = proportionalAmounts(SEASON_TOTAL_PRICE, weights);

  return templates.map((template, index) => ({
    installmentNumber: index + 1,
    amount: amounts[index]!,
    dueDate: addMonths(startDate, template.monthsUntilDue),
    description: `${template.label} · ${template.monthsCovered} month${template.monthsCovered > 1 ? "s" : ""}`,
    monthsCovered: template.monthsCovered,
  }));
}

export function getScheduleOption(schedule: PaymentSchedule) {
  return PAYMENT_SCHEDULE_OPTIONS.find((option) => option.id === schedule)!;
}

export function formatPaymentScheduleLabel(schedule: PaymentSchedule): string {
  return getScheduleOption(schedule).label;
}

export function getFirstInstallmentAmount(schedule: PaymentSchedule): number {
  return buildInstallments(schedule)[0]?.amount ?? SEASON_TOTAL_PRICE;
}
