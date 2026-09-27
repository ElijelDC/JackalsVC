export function roundEur(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Reduce instalment amounts from earliest first. Returns new amounts and
 * how much credit was consumed.
 */
export function applyMembershipCreditToAmounts(
  amounts: number[],
  creditEur: number,
): { amounts: number[]; appliedEur: number } {
  let remaining = roundEur(Math.max(0, creditEur));
  if (remaining <= 0) {
    return { amounts: amounts.map(roundEur), appliedEur: 0 };
  }

  const next = amounts.map((amount) => {
    const current = roundEur(Math.max(0, amount));
    if (remaining <= 0 || current <= 0) return current;
    const applied = Math.min(current, remaining);
    remaining = roundEur(remaining - applied);
    return roundEur(current - applied);
  });

  return {
    amounts: next,
    appliedEur: roundEur(Math.max(0, creditEur) - remaining),
  };
}

export const MEMBERSHIP_CREDIT_NOTE_SUFFIX =
  "credit (merch/fun session overpayment)";

export function formatMembershipCreditNote(appliedEur: number): string {
  const label =
    appliedEur % 1 === 0 ? appliedEur.toFixed(0) : appliedEur.toFixed(2);
  return ` · €${label} ${MEMBERSHIP_CREDIT_NOTE_SUFFIX}`;
}

export function withMembershipCreditNote(
  description: string,
  appliedEur: number,
): string {
  if (appliedEur <= 0) return description;
  if (description.includes(MEMBERSHIP_CREDIT_NOTE_SUFFIX)) return description;
  return `${description}${formatMembershipCreditNote(appliedEur)}`;
}

/** Parse applied credit amount from a payment description, if present. */
export function parseAppliedMembershipCreditEur(
  description: string | null | undefined,
): number | null {
  if (!description) return null;
  const match = description.match(
    /€(\d+(?:\.\d{1,2})?)\s+credit \(merch\/fun session overpayment\)/i,
  );
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}
