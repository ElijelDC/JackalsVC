import { notFound } from "next/navigation";
import { ShopShowcase } from "@/components/shop/ShopShowcase";
import { SHOP_ENABLED } from "@/lib/features";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Shop",
};

export default async function ShopPage() {
  if (!SHOP_ENABLED) {
    notFound();
  }
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const categories = [...new Set(products.map((product) => product.category))];

  return <ShopShowcase products={products} categories={categories} />;
}
