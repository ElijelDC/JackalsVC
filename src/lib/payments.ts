import { format } from "date-fns";

export const CLUB_IBAN_DEFAULT = "IE89SUMU99036511293898";

export function buildPaymentReference(memberName: string, dueDate: Date): string {
  return `${memberName.trim()} ${format(dueDate, "d MMM yyyy")}`;
}

export function parsePaymentReference(reference: string): {
  memberName: string;
  dateLabel: string;
} {
  const parts = reference.trim().split(/\s+/);

  if (parts.length >= 4) {
    return {
      memberName: parts.slice(0, -3).join(" "),
      dateLabel: parts.slice(-3).join(" "),
    };
  }

  return { memberName: reference.trim(), dateLabel: "" };
}

export type ClubBankDetails = {
  accountHolder: string;
  iban: string;
  accountLabel: string;
};

export function getClubBankDetails(): ClubBankDetails {
  return {
    accountHolder: process.env.CLUB_ACCOUNT_HOLDER ?? "Jackals VC",
    iban: process.env.CLUB_IBAN?.trim() || CLUB_IBAN_DEFAULT,
    accountLabel: "SumUp Business Account",
  };
}

export function hasClubBankDetails(): boolean {
  return Boolean(getClubBankDetails().iban);
}
