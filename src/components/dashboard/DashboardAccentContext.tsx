"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DASHBOARD_ACCENT,
  type DashboardAccent,
  type DashboardAccentClasses,
} from "@/lib/dashboard-accent";
import { cn } from "@/lib/utils";

const DashboardAccentContext = createContext<DashboardAccent>("red");

export function DashboardAccentProvider({
  accent,
  children,
  className,
}: {
  accent: DashboardAccent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardAccentContext.Provider value={accent}>
      <div
        className={cn(
          accent === "purple" && "theme-accent-d3w",
          className,
        )}
        data-accent={accent}
      >
        {children}
      </div>
    </DashboardAccentContext.Provider>
  );
}

export function useDashboardAccent(): DashboardAccentClasses {
  const accent = useContext(DashboardAccentContext);
  return DASHBOARD_ACCENT[accent];
}

export function useDashboardAccentKind(): DashboardAccent {
  return useContext(DashboardAccentContext);
}
