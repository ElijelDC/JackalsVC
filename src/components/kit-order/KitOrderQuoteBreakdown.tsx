import { formatMembershipEuro } from "@/lib/membership-2026-27";
import type { KitOrderLineItem } from "@/lib/kit-order-config";
import { cn } from "@/lib/utils";

export function KitOrderQuoteBreakdown({
  items,
  totalEur,
  className,
  compact = false,
}: {
  items: KitOrderLineItem[];
  totalEur: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <ul
        className={cn(
          "divide-y divide-white/10",
          compact ? "text-sm" : "",
        )}
      >
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start justify-between gap-4",
              compact ? "py-2" : "py-3",
            )}
          >
            <div className="min-w-0">
              <p className="font-medium text-white">{item.label}</p>
              {item.details.length > 0 ? (
                <div className="mt-0.5 space-y-0.5 text-sm text-zinc-500">
                  {item.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="shrink-0 font-semibold text-white">
              {item.amountEur <= 0 ? "Free" : formatMembershipEuro(item.amountEur)}
            </p>
          </li>
        ))}
      </ul>
      <div
        className={cn(
          "flex items-baseline justify-between gap-4 border-t border-white/10 pt-3",
          compact ? "text-sm" : "",
        )}
      >
        <p className="font-semibold uppercase tracking-wider text-zinc-400">
          Total due
        </p>
        <p
          className={cn(
            "font-display font-bold text-white",
            compact ? "text-xl" : "text-3xl",
          )}
        >
          {formatMembershipEuro(totalEur)}
        </p>
      </div>
    </div>
  );
}
