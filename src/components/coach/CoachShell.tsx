"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Dumbbell,
  GraduationCap,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { cn } from "@/lib/utils";

export { DashboardSection as CoachSection };

type CoachLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const COACH_NAV_LINKS: CoachLink[] = [
  { href: "/coach/training", label: "Training times", icon: Dumbbell },
  { href: "/coach/matches", label: "Matches", icon: Trophy },
  { href: "/coach/clinics", label: "Skills clinics", icon: GraduationCap },
];

function CoachNavItem({
  link,
  active,
}: {
  link: CoachLink;
  active: boolean;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-jackals-red/15 text-jackals-red-light"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {link.label}
    </Link>
  );
}

export function CoachShell({
  teamName,
  children,
}: {
  teamName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-jackals-red/15 text-jackals-red-light">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <h1 className="font-display text-2xl font-bold text-white">
              Squad management
            </h1>
            <p className="text-sm text-zinc-400">{teamName}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {COACH_NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);

              return (
                <CoachNavItem key={link.href} link={link} active={active} />
              );
            })}
          </nav>

          <Link
            href="/training"
            className="mt-4 hidden items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300 lg:flex"
          >
            <Calendar className="h-4 w-4" />
            View squad schedule
          </Link>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

