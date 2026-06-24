"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  Banknote,
  Bell,
  Calendar,
  Camera,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Flag,
  LayoutDashboard,
  Menu,
  Package,
  PartyPopper,
  Settings,
  ShoppingBag,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  Volleyball,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SHOP_ENABLED } from "@/lib/features";
import { cn } from "@/lib/utils";

type AdminLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const ADMIN_NAV_GROUPS: { title: string; links: AdminLink[] }[] = [
  {
    title: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Club members",
    links: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/registration-reviews", label: "Registration review", icon: UserPlus },
      { href: "/admin/squads", label: "Squads", icon: Flag },
      { href: "/admin/roster", label: "Registered Members", icon: ClipboardList },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: UserCheck },
    ],
  },
  {
    title: "Billing",
    links: [
      { href: "/admin/membership", label: "Plans", icon: CreditCard },
      { href: "/admin/payments", label: "Payments", icon: Banknote },
      { href: "/admin/coach-payments", label: "Coach payments", icon: Wallet },
    ],
  },
  {
    title: "Schedule",
    links: [
      { href: "/admin/training", label: "Weekly training", icon: Dumbbell },
      { href: "/admin/matches", label: "Matches", icon: Trophy },
      { href: "/admin/fun-sessions", label: "Fun sessions", icon: PartyPopper },
      { href: "/admin/events", label: "Calendar", icon: Calendar },
      { href: "/admin/reminders", label: "Reminders", icon: Bell },
    ],
  },
  {
    title: "Club content",
    links: [
      { href: "/admin/gallery", label: "Gallery", icon: Camera },
      { href: "/admin/achievements", label: "Achievements", icon: Award },
      { href: "/admin/teams", label: "Teams", icon: Volleyball },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    ],
  },
]
  .map((group) => ({
    ...group,
    links: group.links.filter(
      (link) =>
        SHOP_ENABLED ||
        (link.href !== "/admin/products" && link.href !== "/admin/orders"),
    ),
  }))
  .filter((group) => group.links.length > 0);

function getActiveAdminLabel(pathname: string): string {
  let best: AdminLink | null = null;

  for (const group of ADMIN_NAV_GROUPS) {
    for (const link of group.links) {
      const active = link.exact
        ? pathname === link.href
        : pathname === link.href || pathname.startsWith(`${link.href}/`);

      if (active && (!best || link.href.length > best.href.length)) {
        best = link;
      }
    }
  }

  return best?.label ?? "Dashboard";
}

function AdminNavLink({
  href,
  label,
  icon: Icon,
  exact,
  onNavigate,
  fullWidth = false,
  badgeCount = 0,
}: AdminLink & {
  onNavigate?: () => void;
  fullWidth?: boolean;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors",
        fullWidth ? "min-h-11 w-full py-2.5" : "shrink-0 py-2",
        active
          ? "bg-jackals-red/15 text-jackals-red-light"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badgeCount > 0 && (
        <span
          className="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-zinc-950"
          aria-label={`${badgeCount} pending`}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

function AdminNavGroups({
  onNavigate,
  fullWidth = false,
  badgeCounts = {},
}: {
  onNavigate?: () => void;
  fullWidth?: boolean;
  badgeCounts?: Record<string, number>;
}) {
  return (
    <>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.title} className="pb-6 last:pb-0">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.links.map((link) => (
              <AdminNavLink
                key={link.href}
                {...link}
                onNavigate={onNavigate}
                fullWidth={fullWidth}
                badgeCount={badgeCounts[link.href] ?? 0}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminShell({
  children,
  badgeCounts = {},
}: {
  children: React.ReactNode;
  badgeCounts?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  const activeLabel = getActiveAdminLabel(pathname);
  const pendingNavCount = Object.values(badgeCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  const mobileNavDrawer =
    mobileNavOpen &&
    canPortal &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <aside
          id="admin-mobile-nav"
          className="flex h-full w-[min(100%,20rem)] shrink-0 flex-col border-r border-white/10 bg-zinc-950 shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="font-display text-base font-semibold text-white">
              Admin navigation
            </span>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pb-12 [-webkit-overflow-scrolling:touch]">
            <AdminNavGroups
              onNavigate={() => setMobileNavOpen(false)}
              fullWidth
              badgeCounts={badgeCounts}
            />
          </nav>
        </aside>
        <button
          type="button"
          aria-label="Close admin navigation"
          className="min-w-0 flex-1 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
      </div>,
      document.body,
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-jackals-red-light">
            <Settings className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Admin
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-white sm:text-3xl">
            Club management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage members, sessions, and club content from one place.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-jackals-red/30 hover:text-jackals-red-light sm:w-auto"
        >
          ← Back to site
        </Link>
      </div>

      <div className="sticky top-[4.25rem] z-40 -mx-4 mb-4 border-b border-white/10 bg-background/95 px-4 py-2 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex min-h-11 w-full items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:border-jackals-red/30 hover:bg-white/5"
          aria-expanded={mobileNavOpen}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1 truncate">{activeLabel}</span>
          {pendingNavCount > 0 ? (
            <span className="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-zinc-950">
              {pendingNavCount > 99 ? "99+" : pendingNavCount}
            </span>
          ) : (
            <span className="shrink-0 text-xs text-zinc-500">Menu</span>
          )}
        </button>
      </div>

      {mobileNavDrawer}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <nav className="hidden space-y-6 lg:block">
          <AdminNavGroups badgeCounts={badgeCounts} />
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 sm:mb-6">
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
