"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types/product";
import { useAddToCart } from "@/hooks/useAddToCart";
import { ProductImage } from "@/components/shop/ProductImage";
import { SizeSelector } from "@/components/shop/SizeSelector";
import { Button } from "@/components/ui/Button";
import { formatCategoryLabel, formatPrice, parseJsonArray } from "@/lib/utils";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const sizes = parseJsonArray(product.sizes);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const { addToCart, added } = useAddToCart(product);
  const outOfStock = product.stock === 0;

  return (
    <article className="motion-hover-lift group relative flex flex-col overflow-hidden border border-white/10 bg-jackals-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/40 hover:shadow-[0_24px_70px_rgba(232,34,42,0.12)]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-jackals-red/10 blur-3xl opacity-60 transition-opacity group-hover:opacity-100"
      />

      <Link href={`/shop/${product.id}`} className="relative block">
        <ProductImage
          imageUrl={product.imageUrl}
          alt={product.name}
          className="aspect-[4/5] w-full"
        />
        <div className="absolute left-3 top-3 z-10 inline-flex items-center border border-jackals-red/30 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-jackals-red-light backdrop-blur-sm">
          {formatCategoryLabel(product.category)}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <span className="border border-white/20 bg-black/70 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-jackals-red-light sm:text-xl">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">
          {product.description}
        </p>

        <div className="mt-4 flex items-end justify-between gap-2">
          <span className="font-display text-2xl font-bold text-jackals-red-light">
            {formatPrice(product.price)}
          </span>
          {!outOfStock && (
            <span className="text-xs font-medium text-zinc-500">
              {product.stock} in stock
            </span>
          )}
        </div>

        {sizes.length > 0 && (
          <div className="mt-4">
            <SizeSelector
              sizes={sizes}
              selected={selectedSize}
              onSelect={setSelectedSize}
            />
          </div>
        )}

        <Button
          className="mt-5 w-full"
          disabled={outOfStock}
          onClick={() => addToCart({ size: selectedSize })}
        >
          <ShoppingCart className="h-4 w-4" />
          {added ? "Added!" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}
