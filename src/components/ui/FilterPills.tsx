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
    <div className={cn("mb-8 flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === option
              ? "bg-jackals-red text-white"
              : "bg-jackals-surface text-zinc-400 hover:text-white",
          )}
        >
          {formatCategoryLabel(option)}
        </button>
      ))}
    </div>
  );
}
