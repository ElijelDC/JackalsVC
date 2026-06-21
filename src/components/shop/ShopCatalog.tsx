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
        />
      </AnimateIn>
      {filtered.length === 0 ? (
        <AnimateIn delay={50}>
          <p className="text-center text-zinc-400">No products found.</p>
        </AnimateIn>
      ) : (
        <StaggerIn className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </StaggerIn>
      )}
    </>
  );
}
