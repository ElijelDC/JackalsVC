import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MemberPaymentStatus } from "@/components/membership/MemberPaymentStatus";
import { MembershipCheckout } from "@/components/membership/MembershipPlans";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimatedBlock } from "@/components/motion/AnimatedBlock";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  CLUB_MEMBERSHIP_PLAN_NAME,
  formatPaymentScheduleLabel,
  type PaymentSchedule,
} from "@/lib/membership-config";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/utils";

export const metadata = {
  title: CLUB_MEMBERSHIP_PLAN_NAME,
};

export default async function MembershipPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/membership");
  }

  const [membership, activePlan] = await Promise.all([
    prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membershipPlan.findFirst({
      where: { active: true },
      orderBy: { price: "asc" },
    }),
  ]);

  if (membership) {
    const payments = await prisma.payment.findMany({
      where: { membershipId: membership.id },
      orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
    });
    const clubBank = getClubBankDetails();

    return (
      <PageContainer>
        <PageHeader
          title={CLUB_MEMBERSHIP_PLAN_NAME}
          description={`${session.user.name} — your membership payments`}
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

        <AnimatedBlock delay={80} className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/dashboard" className="text-jackals-red-light hover:text-jackals-red">
            Back to dashboard
          </Link>
          {" · "}
          Payment schedule cannot be changed
        </AnimatedBlock>
      </PageContainer>
    );
  }

  if (!activePlan) {
    return (
      <PageContainer>
        <PageHeader
          title={CLUB_MEMBERSHIP_PLAN_NAME}
          description="Club membership is not available right now."
          centered
        />
        <AnimatedBlock delay={80}>
          <Card>
            <CardTitle>Check back soon</CardTitle>
            <CardDescription className="mt-2">
              The club hasn&apos;t published a membership plan yet. Contact an admin if you think
              this is a mistake.
            </CardDescription>
          </Card>
        </AnimatedBlock>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={CLUB_MEMBERSHIP_PLAN_NAME}
        description="Choose one payment plan — monthly, three instalments, or pay in full."
        centered
      />

      <MembershipCheckout
        plan={{
          id: activePlan.id,
          name: activePlan.name,
          description: activePlan.description,
          price: activePlan.price,
          durationMonths: activePlan.durationMonths,
          features: parseJsonArray(activePlan.features),
        }}
      />
    </PageContainer>
  );
}
