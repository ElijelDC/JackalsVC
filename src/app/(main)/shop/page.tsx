import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

export const metadata = {
  title: "Shop",
};

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <PageContainer>
      <div className="mb-10 flex items-start justify-between gap-4">
        <PageHeader
          title="Club Shop"
          description="Official Jackals VC jerseys, kit, and merchandise."
          className="mb-0"
        />
        <Link
          href="/shop/cart"
          className="flex shrink-0 items-center gap-2 border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
        </Link>
      </div>

      <ShopCatalog products={products} categories={categories} />
    </PageContainer>
  );
}
