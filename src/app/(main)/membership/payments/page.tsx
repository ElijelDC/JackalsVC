import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { MemberPaymentStatus } from "@/components/membership/MemberPaymentStatus";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { formatPaymentScheduleLabel, type PaymentSchedule } from "@/lib/membership-config";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Payment status | Jackals VC",
};

export default async function MembershipPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/membership/payments");

  const [membership, payments] = await Promise.all([
    prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!membership) {
    redirect("/membership");
  }

  const clubBank = getClubBankDetails();

  return (
    <PageContainer>
      <PageHeader
        title="Payment status"
        description={`${session.user.name} — your season membership payments`}
        centered
      />

      <MemberPaymentStatus
        memberName={session.user.name ?? "Member"}
        membership={{
          status: membership.status,
          paymentSchedule: membership.paymentSchedule as PaymentSchedule,
          planName: membership.plan.name,
          endDate: membership.endDate.toISOString(),
          scheduleLabel: formatPaymentScheduleLabel(
            membership.paymentSchedule as PaymentSchedule,
          ),
        }}
        payments={payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          description: payment.description,
          status: payment.status,
          paymentReference: payment.paymentReference,
          installmentNumber: payment.installmentNumber,
          dueDate: payment.dueDate?.toISOString() ?? null,
          paidAt: payment.paidAt?.toISOString() ?? null,
          proofScreenshotUrl: payment.proofScreenshotUrl,
          proofSubmittedAt: payment.proofSubmittedAt?.toISOString() ?? null,
        }))}
        clubBank={clubBank}
      />

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/dashboard" className="text-jackals-red-light hover:text-jackals-red">
          Back to dashboard
        </Link>
        {" · "}
        Payment schedule cannot be changed
      </p>
    </PageContainer>
  );
}
