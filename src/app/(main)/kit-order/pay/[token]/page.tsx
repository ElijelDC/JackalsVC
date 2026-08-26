import { notFound } from "next/navigation";
import { KitOrderPaymentView } from "@/components/kit-order/KitOrderPaymentView";
import { PageContainer } from "@/components/layout/PageShell";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Kit order payment",
  description: "Pay for your Jackals VC kit order by bank transfer.",
  path: "/kit-order/pay",
  noIndex: true,
});

export default async function KitOrderPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await prisma.kitOrder.findUnique({
    where: { paymentToken: token },
  });

  if (!row) notFound();

  return (
    <PageContainer className="max-w-3xl">
      <KitOrderPaymentView
        order={serializeKitOrder(row)}
        clubBank={getClubBankDetails()}
      />
    </PageContainer>
  );
}
