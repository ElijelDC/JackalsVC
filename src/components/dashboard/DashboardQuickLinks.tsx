"use client";

import Link from "next/link";
import { CalendarRange, Camera, ShoppingBag } from "lucide-react";
import { withDashboardReturn } from "@/lib/dashboard-return";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    id: "fixtures",
    label: "Season fixtures",
    shortLabel: "Fixtures",
    description: "Full season schedule",
    icon: CalendarRange,
    buildHref: (teamKey: string | null) =>
      teamKey ? `/fixtures?team=${teamKey}` : "/fixtures?team=all",
  },
  {
    id: "merch",
    label: "Merch order",
    shortLabel: "Merch",
    description: "Club kit & extras",
    icon: ShoppingBag,
    buildHref: () => "/merchandise-order",
  },
  {
    id: "gallery",
    label: "Gallery",
    shortLabel: "Gallery",
    description: "Match day photos",
    icon: Camera,
    buildHref: () => "/gallery",
  },
] as const;

export function DashboardQuickLinks({
  memberTeamKey = null,
  className,
}: {
  memberTeamKey?: string | null;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-2.5 sm:mb-4">
        <h2 className="font-display text-base font-semibold text-white sm:text-xl">
          Quick links
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-zinc-500 sm:text-xs">
          Jump to fixtures, merch, and photos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {QUICK_LINKS.map(({ id, label, shortLabel, description, icon: Icon, buildHref }) => (
          <Link
            key={id}
            href={withDashboardReturn(buildHref(memberTeamKey))}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-2 py-4 text-center transition-colors",
              "hover:border-jackals-red/30 hover:bg-jackals-red/[0.05]",
              "sm:gap-3 sm:px-4 sm:py-5",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border border-jackals-red/25 bg-jackals-red/10 text-jackals-red-light",
                "transition-colors group-hover:border-jackals-red/40 group-hover:bg-jackals-red/20",
                "sm:h-14 sm:w-14",
              )}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-xs font-semibold text-white sm:text-sm">
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </p>
              <p className="mt-0.5 hidden text-[11px] text-zinc-500 sm:block">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
