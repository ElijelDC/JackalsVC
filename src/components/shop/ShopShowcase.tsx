"use client";

import Link from "next/link";
import { Package, ShoppingBag, ShoppingCart, Tag } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
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
      <section className="relative overflow-hidden border-b border-white/10 bg-background hero-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.18),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 home-hero-grid opacity-30"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <AnimateIn immediate>
            <Link
              href="/shop/cart"
              className="absolute right-4 top-12 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-jackals-red/40 hover:text-jackals-red-light clip-slash-reverse sm:right-6 lg:right-8"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </AnimateIn>

          <AnimateIn immediate className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-5xl lg:text-6xl">
              Club{" "}
              <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                Shop
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              Official Jackals VC jerseys, kit, and merchandise — rep the club on
              and off the court.
            </p>

            {products.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-jackals-red-light" />
                  <span>
                    <span className="font-display text-2xl font-bold text-white">
                      {products.length}
                    </span>{" "}
                    {products.length === 1 ? "product" : "products"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-jackals-red-light" />
                  <span>
                    <span className="font-display text-2xl font-bold text-white">
                      {categories.length}
                    </span>{" "}
                    {categories.length === 1 ? "category" : "categories"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-jackals-red-light" />
                  <span>
                    <span className="font-display text-2xl font-bold text-white">
                      {inStock}
                    </span>{" "}
                    in stock
                  </span>
                </div>
              </div>
            )}
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ShopCatalog products={products} categories={categories} />
      </div>
    </>
  );
}
