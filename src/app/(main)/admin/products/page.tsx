import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const metadata = {
  title: "Admin · Products",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return <ProductsManager initialProducts={products} />;
}
