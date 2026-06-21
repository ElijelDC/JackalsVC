"use client";

import { AnimateIn } from "@/components/motion/AnimateIn";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
  centered = false,
}: {
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
}) {
  return (
    <AnimateIn
      className={cn("mb-10", centered && "text-center", className)}
    >
      <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-zinc-400",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </AnimateIn>
  );
}
