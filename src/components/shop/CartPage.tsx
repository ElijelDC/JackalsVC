"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/shop/CartProvider";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormMessage";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { apiPost } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";

export function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    if (!session) {
      router.push("/login?callbackUrl=/shop/cart");
      return;
    }

    if (items.length === 0) return;

    setLoading(true);
    setError(null);

    const result = await apiPost("/api/orders", {
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
      })),
    }, "Checkout failed");

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clearCart();
    router.push("/dashboard");
  };

  if (items.length === 0) {
    return (
      <AnimateIn immediate>
        <Card className="text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <CardTitle>Your cart is empty</CardTitle>
          <p className="mt-2 text-sm text-zinc-400">
            Browse the shop to find jerseys and club merchandise.
          </p>
          <Link href="/shop">
            <Button className="mt-6">Browse shop</Button>
          </Link>
        </Card>
      </AnimateIn>
    );
  }

  return (
    <AnimateIn immediate>
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <Card key={`${item.productId}-${item.size}`} className="flex gap-4">
            <ProductPlaceholder className="h-20 w-20 shrink-0" size="sm" />
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  {item.size && (
                    <p className="text-sm text-zinc-500">Size: {item.size}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.size)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1, item.size)
                    }
                    className="border border-white/10 p-1 text-zinc-400 hover:text-white"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1, item.size)
                    }
                    className="border border-white/10 p-1 text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="font-semibold text-jackals-red-light">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <Card>
          <CardTitle>Order summary</CardTitle>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-white">
              <span>Total</span>
              <span className="text-jackals-red-light">{formatPrice(total)}</span>
            </div>
          </div>

          <FormError message={error} />

          <Button className="mt-6 w-full" disabled={loading} onClick={checkout}>
            {loading
              ? "Processing..."
              : session
                ? "Complete order"
                : "Sign in to checkout"}
          </Button>
        </Card>
      </div>
    </div>
    </AnimateIn>
  );
}
