import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { requireShopEnabled } from "@/lib/shop.server";

export const metadata = {
  title: "Admin · Products",
};

export default async function AdminProductsPage() {
  requireShopEnabled();

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return <ProductsManager initialProducts={products} />;
}
