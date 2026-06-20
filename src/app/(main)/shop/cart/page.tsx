import { CartPage } from "@/components/shop/CartPage";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

export const metadata = {
  title: "Cart | Shop",
};

export default function CartRoute() {
  return (
    <PageContainer>
      <PageHeader title="Shopping cart" className="mb-8" />
      <CartPage />
    </PageContainer>
  );
}
