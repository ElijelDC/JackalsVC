import { KitOrderForm } from "@/components/kit-order/KitOrderForm";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { KIT_ORDER_NUMBER_CLASH_COPY } from "@/lib/kit-order-config";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 kit order",
  description:
    "Order your Jackals VC 2026/27 match kit. A full kit is €60, and women's orders can take the top only for €40.",
  path: "/kit-order",
  noIndex: true,
});

export default function KitOrderPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="2026/27 kit order"
        description={`A full kit is €60. Women's orders can take the top only for €40. Add a training t-shirt or club jacket if you want one. Last name goes on the back of the jersey — pick two kit numbers in case your first choice is taken. ${KIT_ORDER_NUMBER_CLASH_COPY}`}
      />
      <KitOrderForm />
    </PageContainer>
  );
}
