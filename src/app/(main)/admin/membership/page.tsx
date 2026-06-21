import { prisma } from "@/lib/prisma";
import { MembershipPlansManager } from "@/components/admin/MembershipPlansManager";

export const metadata = {
  title: "Admin · Membership",
};

export default async function AdminMembershipPage() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { memberships: true } } },
  });

  return <MembershipPlansManager initialPlans={plans} />;
}
