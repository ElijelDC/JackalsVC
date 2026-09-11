"use client";

import Link from "next/link";
import { CalendarRange, Camera, ShoppingBag } from "lucide-react";
import { withDashboardReturn } from "@/lib/dashboard-return";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    id: "fixtures",
    label: "Fixtures",
    icon: CalendarRange,
    buildHref: (teamKey: string | null) =>
      teamKey ? `/fixtures?team=${teamKey}` : "/fixtures?team=all",
  },
  {
    id: "merch",
    label: "Merch",
    icon: ShoppingBag,
    buildHref: () => "/merchandise-order",
  },
  {
    id: "gallery",
    label: "Gallery",
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
      <div className="mb-3">
        <h2 className="font-display text-[0.95rem] font-semibold tracking-wide text-white sm:text-xl">
          Links
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {QUICK_LINKS.map(({ id, label, icon: Icon, buildHref }) => (
          <Link
            key={id}
            href={withDashboardReturn(buildHref(memberTeamKey))}
            className={cn(
              "group flex flex-col items-center gap-2.5 rounded-xl border border-white/10 bg-jackals-surface/80 px-2 py-4 text-center",
              "transition-colors hover:border-jackals-red/30 hover:bg-jackals-red/[0.05]",
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-jackals-red/10 text-jackals-red-light transition-colors group-hover:bg-jackals-red/20 sm:h-12 sm:w-12">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
            </div>
            <p className="font-display text-xs font-semibold text-white sm:text-sm">
              {label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
