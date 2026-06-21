import { CartPage } from "@/components/shop/CartPage";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { requireShopEnabled } from "@/lib/shop.server";

export const metadata = {
  title: "Cart | Shop",
};

export default function CartRoute() {
  requireShopEnabled();

  return (
    <PageContainer>
      <PageHeader title="Shopping cart" className="mb-8" />
      <CartPage />
    </PageContainer>
  );
}
