"use client";

import { cn } from "@/lib/utils";

export function SizeSelector({
  sizes,
  selected,
  onSelect,
  size = "sm",
}: {
  sizes: string[];
  selected?: string;
  onSelect: (size: string) => void;
  size?: "sm" | "md";
}) {
  if (sizes.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap", size === "sm" ? "gap-1.5" : "gap-2")}>
      {sizes.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={cn(
            "border font-medium transition-colors",
            size === "sm" ? "rounded px-2.5 py-1 text-xs" : "rounded-lg px-4 py-2 text-sm",
            selected === option
              ? "border-jackals-red bg-jackals-red/15 text-jackals-red-light"
              : "border-white/10 text-zinc-400 hover:border-white/20",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
