"use client";

import type { ReactNode } from "react";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { cn } from "@/lib/utils";

export function AnimatedPageSections({
  children,
  className,
  stagger = 100,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <StaggerIn className={cn("space-y-8", className)} stagger={stagger}>
      {children}
    </StaggerIn>
  );
}
