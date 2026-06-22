"use client";

import type { ReactNode } from "react";
import { StaggerIn } from "@/components/motion/StaggerIn";

export function AdminOverviewGrid({ children }: { children: ReactNode }) {
  return (
    <StaggerIn
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
      stagger={70}
    >
      {children}
    </StaggerIn>
  );
}
