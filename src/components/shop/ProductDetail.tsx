"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types/product";
import { useAddToCart } from "@/hooks/useAddToCart";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { SizeSelector } from "@/components/shop/SizeSelector";
import { Button } from "@/components/ui/Button";
import { formatPrice, parseJsonArray } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const sizes = parseJsonArray(product.sizes);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, added } = useAddToCart(product);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductPlaceholder className="aspect-square" size="lg" />

      <div>
        <span className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          {product.category}
        </span>
        <h1 className="font-display mt-2 text-3xl font-bold text-white">{product.name}</h1>
        <p className="mt-4 text-2xl font-bold text-jackals-red-light">
          {formatPrice(product.price)}
        </p>
        <p className="mt-4 leading-relaxed text-zinc-400">{product.description}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {product.stock > 0
            ? `${product.stock} available`
            : "Currently out of stock"}
        </p>

        {sizes.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-zinc-300">Size</p>
            <SizeSelector
              sizes={sizes}
              selected={selectedSize}
              onSelect={setSelectedSize}
              size="md"
            />
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center border border-white/10">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-zinc-400 hover:text-white"
            >
              −
            </button>
            <span className="w-10 text-center text-white">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="px-3 py-2 text-zinc-400 hover:text-white"
            >
              +
            </button>
          </div>

          <Button
            disabled={product.stock === 0}
            onClick={() => addToCart({ size: selectedSize, quantity })}
          >
            <ShoppingCart className="h-4 w-4" />
            {added ? "Added to cart!" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
