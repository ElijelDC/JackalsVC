import { KitOrderForm } from "@/components/kit-order/KitOrderForm";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { KIT_ORDER_NUMBER_CLASH_COPY } from "@/lib/kit-order-config";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 kit order",
  description:
    "Order your Jackals VC 2026/27 match kit, training top, and club jackets. Choose men's or women's sizing, kit numbers, and the name printed on the jersey.",
  path: "/kit-order",
  noIndex: true,
});

export default function KitOrderPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="2026/27 kit order"
        description={`Player and libero jersey and shorts, training t-shirt, and club jackets. Last name goes on the back of the jersey — pick two kit numbers in case your first choice is taken. ${KIT_ORDER_NUMBER_CLASH_COPY}`}
      />
      <KitOrderForm />
    </PageContainer>
  );
}
