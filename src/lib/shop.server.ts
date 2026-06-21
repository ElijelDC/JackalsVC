import { notFound } from "next/navigation";
import { SHOP_ENABLED } from "@/lib/features";

export function requireShopEnabled() {
  if (!SHOP_ENABLED) {
    notFound();
  }
}
