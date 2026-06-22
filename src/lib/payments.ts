import { format } from "date-fns";

export const CLUB_IBAN_DEFAULT = "IE89SUMU99036511293898";

export function buildPaymentReference(
  memberName: string,
  dueDate: Date,
  installmentNumber?: number,
  installmentTotal?: number,
): string {
  const dateLabel = format(dueDate, "d MMM yyyy");
  const base = memberName.trim();

  if (installmentNumber != null && installmentTotal != null) {
    return `${base} · ${installmentNumber}/${installmentTotal} · ${dateLabel}`;
  }

  return `${base} ${dateLabel}`;
}

export function parsePaymentReference(reference: string): {
  memberName: string;
  dateLabel: string;
} {
  const trimmed = reference.trim();
  const segmented = trimmed.split(" · ").map((part) => part.trim());

  if (segmented.length >= 3) {
    return {
      memberName: segmented.slice(0, -2).join(" · "),
      dateLabel: segmented[segmented.length - 1]!,
    };
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length >= 4) {
    return {
      memberName: parts.slice(0, -3).join(" "),
      dateLabel: parts.slice(-3).join(" "),
    };
  }

  return { memberName: trimmed, dateLabel: "" };
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
