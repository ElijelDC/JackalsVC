import { MerchandiseOrderForm } from "@/components/merchandise-order/MerchandiseOrderForm";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 merchandise order",
  description:
    "Order a Jackals VC training t-shirt, quarter zip, zip hoodie, high collar jacket, or full zip jacket.",
  path: "/merchandise-order",
  noIndex: true,
});

export default function MerchandiseOrderPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="2026/27 merchandise order"
        description="Choose a training t-shirt or one or more club jackets. Select men's or women's fit, review your order, then pay by bank transfer."
      />
      <MerchandiseOrderForm />
    </PageContainer>
  );
}
