import { prisma } from "@/lib/prisma";
import { GrantMembershipPanel } from "@/components/admin/GrantMembershipPanel";
import { MembersManager } from "@/components/admin/MembersManager";

export const metadata = { title: "Admin · Subscriptions" };

export default async function AdminSubscriptionsPage() {
  const [memberships, users, plans] = await Promise.all([
    prisma.membership.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
        payments: {
          select: {
            status: true,
            dueDate: true,
            amount: true,
            installmentNumber: true,
          },
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.membershipPlan.findMany({
      select: { id: true, name: true, price: true },
      orderBy: { price: "asc" },
    }),
  ]);

  const serialized = memberships.map((membership) => ({
    ...membership,
    startDate: membership.startDate.toISOString(),
    endDate: membership.endDate.toISOString(),
    paymentOverdueOverrideUntil:
      membership.paymentOverdueOverrideUntil?.toISOString() ?? null,
    paymentDeferralDueDate:
      membership.paymentDeferralDueDate?.toISOString() ?? null,
    paymentDeferralRequestedAt:
      membership.paymentDeferralRequestedAt?.toISOString() ?? null,
    payments: membership.payments.map((payment) => ({
      status: payment.status,
      dueDate: payment.dueDate?.toISOString() ?? null,
      amount: payment.amount,
      installmentNumber: payment.installmentNumber,
    })),
  }));

  return (
    <div className="space-y-10">
      <GrantMembershipPanel users={users} plans={plans} />
      <MembersManager initialMemberships={serialized} plans={plans} />
    </div>
  );
}
