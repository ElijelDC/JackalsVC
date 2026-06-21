import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { SHOP_ENABLED } from "@/lib/features";

export const metadata = {
  title: "Admin · Products",
};

export default async function AdminProductsPage() {
  if (!SHOP_ENABLED) {
    notFound();
  }

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return <ProductsManager initialProducts={products} />;
}
