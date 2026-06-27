import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EUR = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

function formatMonth(year: number, month: number): string {
  const name = MONTH_NAMES[month - 1] ?? `Month ${month}`;
  return `${name} ${year}`;
}

/**
 * Emails a coach to confirm a salary payment was marked as paid.
 * Never throws — safe to call alongside the DB update.
 */
export async function notifyCoachPaymentPaid(paymentId: string): Promise<void> {
  try {
    const payment = await prisma.coachSalaryPayment.findUnique({
      where: { id: paymentId },
      include: {
        clubMember: {
          select: {
            name: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    const email = payment?.clubMember.user?.email;
    if (!payment || !email) return;

    const monthLabel = formatMonth(payment.year, payment.month);

    await sendNotificationEmail({
      to: email,
      subject: `You've been paid — ${monthLabel} coaching`,
      content: {
        heading: "Coaching payment confirmed",
        greeting: `Hi ${payment.clubMember.name},`,
        paragraphs: [
          `Your coaching payment for ${monthLabel} has been marked as paid by the club. Thanks for all your work on court!`,
        ],
        details: [
          { label: "Month", value: monthLabel },
          { label: "Sessions", value: String(payment.sessionCount) },
          { label: "Amount", value: EUR.format(payment.amount) },
        ],
        ctaUrl: emailSiteUrl("/payments"),
        ctaLabel: "View payment details",
      },
    });
  } catch (error) {
    console.error("[notify] failed to send coach payment email", error);
  }
}
