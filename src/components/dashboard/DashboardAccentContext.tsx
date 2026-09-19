"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DASHBOARD_ACCENT,
  type DashboardAccent,
  type DashboardAccentClasses,
} from "@/lib/dashboard-accent";

const DashboardAccentContext = createContext<DashboardAccent>("red");

export function DashboardAccentProvider({
  accent,
  children,
}: {
  accent: DashboardAccent;
  children: ReactNode;
}) {
  return (
    <DashboardAccentContext.Provider value={accent}>
      {children}
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
