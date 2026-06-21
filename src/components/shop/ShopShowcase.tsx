"use client";

import Link from "next/link";
import { Package, ShoppingBag, ShoppingCart, Tag } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import type { Product } from "@/types/product";

export function ShopShowcase({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const inStock = products.filter((product) => product.stock > 0).length;

  return (
    <>
      <ShowcaseHero
        title="Club"
        highlight="Shop"
        description="Official Jackals VC jerseys, kit, and merchandise — rep the club on and off the court."
        action={
          <AnimateIn immediate>
            <Link
              href="/shop/cart"
              className="absolute right-4 top-12 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-jackals-red/40 hover:text-jackals-red-light clip-slash-reverse sm:right-6 lg:right-8"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </AnimateIn>
        }
        stats={
          products.length > 0
            ? [
                {
                  icon: ShoppingBag,
                  value: products.length,
                  label: products.length === 1 ? "product" : "products",
                },
                {
                  icon: Tag,
                  value: categories.length,
                  label: categories.length === 1 ? "category" : "categories",
                },
                {
                  icon: Package,
                  value: inStock,
                  label: "in stock",
                },
              ]
            : undefined
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ShopCatalog products={products} categories={categories} />
      </div>
    </>
  );
}
