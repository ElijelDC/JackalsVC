import { notFound } from "next/navigation";
import { SpecialOrderPaymentView } from "@/components/special-order/SpecialOrderPaymentView";
import { PageContainer } from "@/components/layout/PageShell";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";

export const metadata = pageMetadata({
  title: "Special order payment",
  description: "Pay for your Jackals VC special order by bank transfer.",
  path: "/special-order/pay",
  noIndex: true,
});

export default async function SpecialOrderPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await prisma.specialOrder.findUnique({
    where: { paymentToken: token },
  });
  if (!row) notFound();
  return (
    <PageContainer className="max-w-3xl">
      <SpecialOrderPaymentView
        order={serializeSpecialOrder(row)}
        clubBank={getClubBankDetails()}
      />
    </PageContainer>
  );
}
