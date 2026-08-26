"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminActiveFilter = {
  id: string;
  label: string;
  onClear: () => void;
};

export function AdminActiveFilterPills({
  filters,
  onClearAll,
}: {
  filters: AdminActiveFilter[];
  onClearAll?: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={filter.onClear}
          className="inline-flex items-center gap-1.5 rounded-full border border-jackals-red/30 bg-jackals-red/10 px-2.5 py-1 text-xs text-jackals-gold transition hover:border-jackals-red/50 hover:bg-jackals-red/15"
        >
          {filter.label}
          <X className="h-3 w-3 opacity-70" />
        </button>
      ))}
      {filters.length > 1 && onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}

export function AdminStatFilterCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "rounded-lg border px-3 py-2.5 text-left transition",
    onClick && "cursor-pointer hover:border-white/20",
    active
      ? "border-jackals-red/45 bg-jackals-red/10 ring-1 ring-jackals-red/20"
      : "border-white/10 bg-white/[0.02]",
  );

  const content = (
    <>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
