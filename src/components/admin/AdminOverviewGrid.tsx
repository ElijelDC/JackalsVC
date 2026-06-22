"use client";

import type { ReactNode } from "react";
import { StaggerIn } from "@/components/motion/StaggerIn";

export function AdminOverviewGrid({ children }: { children: ReactNode }) {
  return (
    <StaggerIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={70}>
      {children}
    </StaggerIn>
  );
}
