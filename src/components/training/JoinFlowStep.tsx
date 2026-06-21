import type { ReactNode } from "react";
import { cn, formatEuroFee } from "@/lib/utils";

export function JoinFlowStep({
  step,
  title,
  children,
  isLast = false,
}: {
  step: number;
  title: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div
          aria-hidden
          className="absolute bottom-0 left-4 top-9 w-px bg-white/10"
        />
      )}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-jackals-red/40 bg-jackals-red/15 text-sm font-bold text-jackals-red-light">
        {step}
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-6")}>
        <h3 className="font-medium text-white">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function EntryFeeBadge({
  amount,
  label,
}: {
  amount: number;
  label: string;
}) {
  return (
    <div className="mb-3 inline-flex items-baseline gap-2 rounded-lg border border-jackals-red/30 bg-jackals-red/10 px-3 py-2">
      <span className="font-display text-2xl font-bold text-white">
        {formatEuroFee(amount)}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-jackals-red-light">
        {label}
      </span>
    </div>
  );
}
