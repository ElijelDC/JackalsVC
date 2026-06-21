import { notFound } from "next/navigation";
import { CartPage } from "@/components/shop/CartPage";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { SHOP_ENABLED } from "@/lib/features";

export const metadata = {
  title: "Cart | Shop",
};

export default function CartRoute() {
  if (!SHOP_ENABLED) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader title="Shopping cart" className="mb-8" />
      <CartPage />
    </PageContainer>
  );
}
