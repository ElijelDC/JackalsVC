"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { FilterPills } from "@/components/ui/FilterPills";
import { ProductCard } from "@/components/shop/ProductCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";

export function ShopCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const [filter, setFilter] = useState("ALL");

  const filtered =
    filter === "ALL"
      ? products
      : products.filter((p) => p.category === filter);

  return (
    <>
      <AnimateIn immediate>
        <FilterPills
          options={["ALL", ...categories]}
          active={filter}
          onChange={setFilter}
          className="mb-10"
        />
      </AnimateIn>
      {filtered.length === 0 ? (
        <AnimateIn delay={50}>
          <div className="relative overflow-hidden border border-dashed border-white/15 bg-jackals-surface/40 px-8 py-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(232,34,42,0.08),transparent_70%)]"
            />
            <p className="relative font-display text-lg font-semibold text-white">
              No products found
            </p>
            <p className="relative mt-2 text-sm text-zinc-500">
              Try a different category or check back soon for new kit.
            </p>
          </div>
        </AnimateIn>
      ) : (
        <StaggerIn className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={80}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </StaggerIn>
      )}
    </>
  );
}
