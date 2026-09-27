import "server-only";

import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { formatEuroFee } from "@/lib/utils";

export async function sendMembershipCreditNoticeEmail(input: {
  to: string;
  memberName: string;
  creditEur: number;
  note: string | null;
  /** When true, credit is already on their next unpaid instalment. */
  alreadyApplied: boolean;
  nextPaymentAmountEur?: number | null;
}) {
  const firstName = input.memberName.trim().split(/\s+/)[0] || "there";
  const creditLabel = formatEuroFee(input.creditEur);
  const reason = input.note?.trim() || "merch / fun session overpayment";
  const membershipUrl = emailSiteUrl("/membership");

  const paragraphs = input.alreadyApplied
    ? [
        `You have a ${creditLabel} membership credit (${reason}).`,
        input.nextPaymentAmountEur != null
          ? `It has already been applied to your upcoming membership payment — please transfer ${formatEuroFee(input.nextPaymentAmountEur)} (the reduced amount), not the original instalment.`
          : `It has already been applied to your upcoming membership payment. Please transfer the reduced amount shown on your membership page.`,
        "You can check the exact amount and pay here:",
      ]
    : [
        `You have a ${creditLabel} membership credit on your Jackals account (${reason}).`,
        "It will come off your upcoming membership payment when you subscribe (or your next unpaid instalment).",
        "View your membership page for details:",
      ];

  return sendNotificationEmail({
    to: input.to,
    subject: `${creditLabel} membership credit on your Jackals account`,
    content: {
      heading: `${creditLabel} membership credit`,
      paragraphs: [`Hi ${firstName},`, ...paragraphs],
      ctaUrl: membershipUrl,
      ctaLabel: "View membership",
    },
  });
}
