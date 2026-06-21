"use client";

import { cn, formatCategoryLabel } from "@/lib/utils";

export function FilterPills({
  options,
  active,
  onChange,
  className,
}: {
  options: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2 sm:justify-start", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "border px-4 py-2 text-sm font-medium transition-all duration-200",
            active === option
              ? "border-jackals-red/40 bg-jackals-red text-white clip-slash shadow-[0_0_20px_rgba(232,34,42,0.25)]"
              : "border-white/10 bg-jackals-surface/80 text-zinc-400 hover:border-jackals-red/30 hover:text-white",
          )}
        >
          {formatCategoryLabel(option)}
        </button>
      ))}
    </div>
  );
}
