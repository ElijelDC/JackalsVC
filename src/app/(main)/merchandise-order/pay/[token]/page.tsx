import { notFound } from "next/navigation";
import { MerchandiseOrderPaymentView } from "@/components/merchandise-order/MerchandiseOrderPaymentView";
import { PageContainer } from "@/components/layout/PageShell";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Merchandise order payment",
  description: "Pay for your Jackals VC merchandise order by bank transfer.",
  path: "/merchandise-order/pay",
  noIndex: true,
});

export default async function MerchandiseOrderPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await prisma.merchandiseOrder.findUnique({
    where: { paymentToken: token },
  });
  if (!row) notFound();
  return (
    <PageContainer className="max-w-3xl">
      <MerchandiseOrderPaymentView
        order={serializeMerchandiseOrder(row)}
        clubBank={getClubBankDetails()}
      />
    </PageContainer>
  );
}
