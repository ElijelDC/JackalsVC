import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MembershipPlans } from "@/components/membership/MembershipPlans";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

export const metadata = {
  title: "Membership",
};

export default async function MembershipPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/membership");
  }

  const plans = await prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Club Membership"
        description="Choose a plan that fits your schedule. All members get access to training sessions and club events."
        centered
      />

      {plans.length === 0 ? (
        <p className="text-center text-zinc-400">Membership plans coming soon.</p>
      ) : (
        <MembershipPlans plans={plans} />
      )}
    </PageContainer>
  );
}
