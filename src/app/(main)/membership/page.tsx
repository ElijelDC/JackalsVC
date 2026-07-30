import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConditionalDashboardBackLink } from "@/components/dashboard/ConditionalDashboardBackLink";
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
import { assessMembershipPaymentAccess } from "@/lib/membership-overdue";
import { getCoachProfile } from "@/lib/coach-auth";
import { isDashboardReturn } from "@/lib/dashboard-return";
import { isCoachMembershipStatus } from "@/lib/membership-status";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: CLUB_MEMBERSHIP_PLAN_NAME,
};

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/membership");
  }

  const { from } = await searchParams;
  const showDashboardBack = isDashboardReturn(from);

  const [membership, activePlans] = await Promise.all([
    prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membershipPlan.findMany({
      where: { active: true },
      orderBy: [{ price: "desc" }, { name: "asc" }],
    }),
  ]);

  if (membership) {
    if (isCoachMembershipStatus(membership.status)) {
      const coach = await getCoachProfile(session.user.id);
      if (coach?.isPaidCoach) {
        redirect(showDashboardBack ? "/payments?from=dashboard" : "/payments");
      }
      redirect("/dashboard");
    }

    const payments = await prisma.payment.findMany({
      where: { membershipId: membership.id },
      orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
    });
    const clubBank = getClubBankDetails();
    const paymentAccess = assessMembershipPaymentAccess({
      membershipStatus: membership.status,
      paymentSchedule: membership.paymentSchedule,
      paymentOverdueOverride: membership.paymentOverdueOverride,
      paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil,
      payments,
    });

    return (
      <PageContainer>
        <ConditionalDashboardBackLink from={from} />
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
            paymentOverdueOverride: membership.paymentOverdueOverride,
            paymentOverdueOverrideUntil:
              membership.paymentOverdueOverrideUntil?.toISOString() ?? null,
            paymentDeferralExcuse: membership.paymentDeferralExcuse,
            paymentDeferralDueDate:
              membership.paymentDeferralDueDate?.toISOString() ?? null,
            paymentDeferralRequestedAt:
              membership.paymentDeferralRequestedAt?.toISOString() ?? null,
          }}
          paymentAccess={paymentAccess}
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

        {!showDashboardBack ? (
          <AnimatedBlock delay={80} className="mt-8 text-center text-sm text-zinc-500">
            <Link href="/dashboard" className="text-jackals-red-light hover:text-jackals-red">
              Back to dashboard
            </Link>
            {" · "}
            Payment schedule cannot be changed
          </AnimatedBlock>
        ) : (
          <AnimatedBlock delay={80} className="mt-8 text-center text-sm text-zinc-500">
            Payment schedule cannot be changed
          </AnimatedBlock>
        )}
      </PageContainer>
    );
  }

  if (activePlans.length === 0) {
    return (
      <PageContainer>
        <ConditionalDashboardBackLink from={from} />
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
      <ConditionalDashboardBackLink from={from} />
      <PageHeader
        title={CLUB_MEMBERSHIP_PLAN_NAME}
        description="Choose your membership type, then pick how you want to pay."
        centered
      />

      <MembershipCheckout
        plans={activePlans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          durationMonths: plan.durationMonths,
        }))}
      />
    </PageContainer>
  );
}
