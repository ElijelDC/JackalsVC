import { ShopShowcase } from "@/components/shop/ShopShowcase";
import { requireShopEnabled } from "@/lib/shop.server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Shop",
};

export default async function ShopPage() {
  requireShopEnabled();
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const categories = [...new Set(products.map((product) => product.category))];

  return <ShopShowcase products={products} categories={categories} />;
}
