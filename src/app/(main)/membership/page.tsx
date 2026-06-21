import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MembershipCheckout } from "@/components/membership/MembershipPlans";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Membership",
};

export default async function MembershipPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/membership");
  }

  const activeMembership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      endDate: { gt: new Date() },
    },
  });

  if (activeMembership) {
    redirect("/membership/payments");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Club Membership"
        description="Every member has the same season membership. Choose your payment schedule once — it cannot be changed later."
        centered
      />

      <MembershipCheckout />
    </PageContainer>
  );
}
