"use client";

import type { ReactNode } from "react";
import { useIntersectionVisible } from "@/hooks/useIntersectionVisible";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export type StaggerVariant = "default" | "pop";

const staggerClass: Record<StaggerVariant, string> = {
  default: "motion-stagger",
  pop: "motion-stagger-pop",
};

export function StaggerIn({
  children,
  className,
  stagger = 80,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  variant?: StaggerVariant;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, visible: intersecting } = useIntersectionVisible<HTMLDivElement>({
    disabled: prefersReducedMotion,
    threshold: 0.04,
  });
  const visible = prefersReducedMotion || intersecting;

  return (
    <div
      ref={ref}
      className={cn(staggerClass[variant], visible && "motion-visible", className)}
      style={{ "--motion-stagger": `${stagger}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
