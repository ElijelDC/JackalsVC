"use client";

import { useState } from "react";
import { useCart } from "@/components/shop/CartProvider";
import type { Product } from "@/types/product";

export function useAddToCart(product: Pick<Product, "id" | "name" | "price" | "imageUrl">) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const addToCart = (options: { size?: string; quantity?: number }) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size: options.size,
      quantity: options.quantity ?? 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return { addToCart, added };
}
