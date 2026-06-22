"use client";

import type { ReactNode } from "react";
import { useIntersectionVisible } from "@/hooks/useIntersectionVisible";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export function StaggerIn({
  children,
  className,
  stagger = 80,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
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
      className={cn("motion-stagger", visible && "motion-visible", className)}
      style={{ "--motion-stagger": `${stagger}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
