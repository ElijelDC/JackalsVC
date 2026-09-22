import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ConditionalDashboardBackLink } from "@/components/dashboard/ConditionalDashboardBackLink";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { SpecialOrderForm } from "@/components/special-order/SpecialOrderForm";
import { findSpecialOrderForMember } from "@/lib/special-order-member";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Special Order",
  description:
    "Order the Jackals warm-up T-shirt and match quarter zip package — €15 due 13 November.",
  path: "/special-order",
  noIndex: true,
});

export default async function SpecialOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/special-order");
  }
  const { from } = await searchParams;
  const existingOrder = await findSpecialOrderForMember({
    userId: session.user.id,
    email: session.user.email,
  });

  return (
    <PageContainer className="max-w-4xl">
      <ConditionalDashboardBackLink from={from} />
      <PageHeader
        title="Special Order"
        description={
          existingOrder
            ? "Your special order is saved. You can open payment details anytime."
            : "Warm-up T-shirt (free) and match quarter zip (€15). One order per member — payment is not due until 13 November."
        }
      />
      <SpecialOrderForm
        initialName={session.user.name ?? ""}
        initialEmail={session.user.email ?? ""}
        existingOrder={existingOrder}
      />
    </PageContainer>
  );
}
