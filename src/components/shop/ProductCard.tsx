"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types/product";
import { useAddToCart } from "@/hooks/useAddToCart";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { SizeSelector } from "@/components/shop/SizeSelector";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatPrice, parseJsonArray } from "@/lib/utils";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const sizes = parseJsonArray(product.sizes);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const { addToCart, added } = useAddToCart(product);

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <Link href={`/shop/${product.id}`}>
        <ProductPlaceholder className="h-48 transition-colors hover:bg-jackals-surface-muted" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {product.category}
        </span>
        <Link href={`/shop/${product.id}`}>
          <CardTitle className="hover:text-jackals-red-light">{product.name}</CardTitle>
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-zinc-400">
          {product.description}
        </p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <span className="text-lg font-bold text-jackals-red-light">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-zinc-500">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>

        {sizes.length > 0 && (
          <div className="mt-3">
            <SizeSelector
              sizes={sizes}
              selected={selectedSize}
              onSelect={setSelectedSize}
            />
          </div>
        )}

        <Button
          className="mt-4 w-full"
          disabled={product.stock === 0}
          onClick={() => addToCart({ size: selectedSize })}
        >
          <ShoppingCart className="h-4 w-4" />
          {added ? "Added!" : "Add to cart"}
        </Button>
      </div>
    </Card>
  );
}
