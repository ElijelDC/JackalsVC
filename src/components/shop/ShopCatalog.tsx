"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { FilterPills } from "@/components/ui/FilterPills";
import { ProductCard } from "@/components/shop/ProductCard";

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
      <FilterPills
        options={["ALL", ...categories]}
        active={filter}
        onChange={setFilter}
      />
      {filtered.length === 0 ? (
        <p className="text-center text-zinc-400">No products found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
