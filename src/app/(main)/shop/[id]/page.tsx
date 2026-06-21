import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { PageContainer } from "@/components/layout/PageShell";
import { requireShopEnabled } from "@/lib/shop.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  return { title: product ? `${product.name} | Shop` : "Product not found" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  requireShopEnabled();

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id, active: true } });

  if (!product) notFound();

  return (
    <PageContainer>
      <Link
        href="/shop"
        className="mb-6 inline-block text-sm text-jackals-red-light hover:text-jackals-red"
      >
        ← Back to shop
      </Link>
      <ProductDetail product={product} />
    </PageContainer>
  );
}
