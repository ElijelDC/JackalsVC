"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  Banknote,
  Bell,
  Calendar,
  Camera,
  ChevronDown,
  ClipboardList,
  ClipboardPen,
  CreditCard,
  Dumbbell,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Package,
  PartyPopper,
  Search,
  Settings,
  Shirt,
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
  keywords?: string;
};

type AdminNavGroup = {
  title: string;
  links: AdminLink[];
};

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Members",
    links: [
      { href: "/admin/roster", label: "Roster", icon: ClipboardList, keywords: "members vly" },
      { href: "/admin/users", label: "Users", icon: Users },
      {
        href: "/admin/registration-reviews",
        label: "Registration review",
        icon: UserPlus,
        keywords: "vly photo approve",
      },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: UserCheck, keywords: "membership" },
      { href: "/admin/trials-applications", label: "Signups", icon: ClipboardPen },
      { href: "/admin/one-off-sessions", label: "One-off sessions", icon: Calendar, keywords: "trial session" },
      {
        href: "/admin/coaching-applications",
        label: "Coaching applications",
        icon: GraduationCap,
      },
      {
        href: "/admin/club-offer-acceptances",
        label: "Club offer responses",
        icon: ClipboardList,
      },
      {
        href: "/admin/coach-offer-acceptances",
        label: "Coach offer responses",
        icon: GraduationCap,
      },
    ],
  },
  {
    title: "Billing",
    links: [
      { href: "/admin/payments", label: "Payments", icon: Banknote, keywords: "membership transfer" },
      { href: "/admin/kit-orders", label: "Kit payments", icon: Shirt, keywords: "kit order" },
      {
        href: "/admin/merchandise-orders",
        label: "Merchandise payments",
        icon: ShoppingBag,
        keywords: "merch order jackets training tshirt",
      },
      { href: "/admin/coach-payments", label: "Coach payments", icon: Wallet },
      { href: "/admin/membership", label: "Plans", icon: CreditCard, keywords: "membership pricing" },
    ],
  },
  {
    title: "Schedule",
    links: [
      { href: "/admin/training", label: "Weekly training", icon: Dumbbell },
      { href: "/admin/squads", label: "Squads", icon: Flag },
      { href: "/admin/teams", label: "Teams", icon: Volleyball },
      { href: "/admin/matches", label: "Matches", icon: Trophy },
      { href: "/admin/events", label: "Calendar", icon: Calendar, keywords: "events tournament" },
      { href: "/admin/fun-sessions", label: "Fun sessions", icon: PartyPopper },
      { href: "/admin/reminders", label: "Reminders", icon: Bell },
    ],
  },
  {
    title: "Content",
    links: [
      { href: "/admin/gallery", label: "Gallery", icon: Camera },
      { href: "/admin/achievements", label: "Achievements", icon: Award },
      { href: "/admin/tournament-photos", label: "Tournament photos", icon: Trophy },
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

const ALL_ADMIN_LINKS = ADMIN_NAV_GROUPS.flatMap((group) =>
  group.links.map((link) => ({ ...link, group: group.title })),
);

const QUICK_LINK_HREFS = [
  "/admin/payments",
  "/admin/kit-orders",
  "/admin/merchandise-orders",
  "/admin/registration-reviews",
  "/admin/one-off-sessions",
  "/admin/coach-payments",
] as const;

function isLinkActive(pathname: string, link: AdminLink) {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function getActiveAdminLink(pathname: string): AdminLink | null {
  let best: AdminLink | null = null;

  for (const link of ALL_ADMIN_LINKS) {
    if (isLinkActive(pathname, link) && (!best || link.href.length > best.href.length)) {
      best = link;
    }
  }

  return best;
}

function getActiveGroupTitle(pathname: string) {
  const active = getActiveAdminLink(pathname);
  if (!active) return "Overview";

  return (
    ADMIN_NAV_GROUPS.find((group) =>
      group.links.some((link) => link.href === active.href),
    )?.title ?? "Overview"
  );
}

function groupBadgeCount(group: AdminNavGroup, badgeCounts: Record<string, number>) {
  return group.links.reduce(
    (sum, link) => sum + (badgeCounts[link.href] ?? 0),
    0,
  );
}

function AdminNavLink({
  href,
  label,
  icon: Icon,
  exact,
  onNavigate,
  badgeCount = 0,
  compact = false,
}: AdminLink & {
  onNavigate?: () => void;
  badgeCount?: number;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = isLinkActive(pathname, { href, label, icon: Icon, exact });

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
        compact ? "min-h-10 px-2.5 py-2" : "min-h-11 px-3 py-2.5",
        active
          ? "bg-jackals-red/15 text-jackals-red-light ring-1 ring-inset ring-jackals-red/25"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badgeCount > 0 ? (
        <span className="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-zinc-950">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </Link>
  );
}

function AdminNavSearch({
  value,
  onChange,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  inputId: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search admin pages…"
        className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-zinc-500 focus:border-jackals-red/40 focus:outline-none focus:ring-1 focus:ring-jackals-red/30"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function AdminQuickLinks({
  badgeCounts,
  onNavigate,
}: {
  badgeCounts: Record<string, number>;
  onNavigate?: () => void;
}) {
  const links = QUICK_LINK_HREFS.map((href) =>
    ALL_ADMIN_LINKS.find((link) => link.href === href),
  ).filter((link): link is (typeof ALL_ADMIN_LINKS)[number] => Boolean(link));

  const withBadges = links.filter((link) => (badgeCounts[link.href] ?? 0) > 0);
  if (withBadges.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
        Needs attention
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {withBadges.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:border-amber-500/50 hover:bg-amber-500/15"
          >
            <link.icon className="h-3.5 w-3.5" />
            {link.label}
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
              {badgeCounts[link.href]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function AdminNavPanel({
  onNavigate,
  badgeCounts = {},
  searchInputId,
}: {
  onNavigate?: () => void;
  badgeCounts?: Record<string, number>;
  searchInputId: string;
}) {
  const pathname = usePathname();
  const activeGroup = getActiveGroupTitle(pathname);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        ADMIN_NAV_GROUPS.map((group) => [
          group.title,
          group.title === activeGroup || group.title === "Billing",
        ]),
      ),
  );

  useEffect(() => {
    setExpandedGroups((current) => ({
      ...current,
      [activeGroup]: true,
    }));
  }, [activeGroup]);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return ALL_ADMIN_LINKS.filter((link) => {
      const haystack = `${link.label} ${link.group} ${link.keywords ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [search]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  return (
    <div className="space-y-4">
      <AdminNavSearch
        value={search}
        onChange={setSearch}
        inputId={searchInputId}
      />

      {!search.trim() ? <AdminQuickLinks badgeCounts={badgeCounts} onNavigate={onNavigate} /> : null}

      {search.trim() ? (
        <div className="space-y-1">
          {filteredLinks.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-zinc-500">
              No pages match &ldquo;{search.trim()}&rdquo;
            </p>
          ) : (
            filteredLinks.map((link) => (
              <div key={link.href}>
                <p className="mb-1 px-3 text-[10px] uppercase tracking-wide text-zinc-600">
                  {link.group}
                </p>
                <AdminNavLink
                  {...link}
                  onNavigate={onNavigate}
                  badgeCount={badgeCounts[link.href] ?? 0}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {ADMIN_NAV_GROUPS.map((group) => {
            const expanded = expandedGroups[group.title] ?? false;
            const pending = groupBadgeCount(group, badgeCounts);
            const isSingle = group.links.length === 1;

            if (isSingle) {
              const link = group.links[0];
              return (
                <AdminNavLink
                  key={link.href}
                  {...link}
                  onNavigate={onNavigate}
                  badgeCount={badgeCounts[link.href] ?? 0}
                />
              );
            }

            return (
              <div
                key={group.title}
                className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.03]"
                  aria-expanded={expanded}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-zinc-500 transition",
                      expanded && "rotate-180",
                    )}
                  />
                  <span className="flex-1">{group.title}</span>
                  {pending > 0 ? (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                      {pending}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-600">{group.links.length}</span>
                  )}
                </button>
                {expanded ? (
                  <div className="space-y-0.5 border-t border-white/8 px-1.5 py-1.5">
                    {group.links.map((link) => (
                      <AdminNavLink
                        key={link.href}
                        {...link}
                        onNavigate={onNavigate}
                        badgeCount={badgeCounts[link.href] ?? 0}
                        compact
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
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
  const activeLink = getActiveAdminLink(pathname);
  const activeLabel = activeLink?.label ?? "Dashboard";
  const ActiveIcon = activeLink?.icon ?? LayoutDashboard;
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
        className="fixed inset-0 z-[100] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <button
          type="button"
          aria-label="Close admin navigation"
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          id="admin-mobile-nav"
          className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-white/10 bg-zinc-950 shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Admin menu
              </p>
              <p className="font-display text-base font-semibold text-white">
                {activeLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pb-8 [-webkit-overflow-scrolling:touch]">
            <AdminNavPanel
              onNavigate={() => setMobileNavOpen(false)}
              badgeCounts={badgeCounts}
              searchInputId="admin-nav-search-mobile"
            />
          </nav>
        </aside>
      </div>,
      document.body,
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-jackals-red-light">
            <Settings className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wider sm:text-sm">
              Admin
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-white sm:text-3xl">
            Club management
          </h1>
          <p className="mt-1 hidden text-sm text-zinc-500 sm:block">
            Manage members, sessions, and club content from one place.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-jackals-red/30 hover:text-jackals-red-light sm:min-h-11 sm:w-auto"
        >
          ← Back to site
        </Link>
      </div>

      <div className="sticky top-[4.25rem] z-40 -mx-4 mb-4 border-b border-white/10 bg-background px-4 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition-colors hover:border-jackals-red/30 hover:bg-white/[0.04]"
          aria-expanded={mobileNavOpen}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="h-4 w-4 shrink-0 text-zinc-400" />
          <ActiveIcon className="h-4 w-4 shrink-0 text-jackals-red-light" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {activeLabel}
          </span>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,18rem)_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/10 bg-white/[0.02] p-3 [-webkit-overflow-scrolling:touch]">
            <AdminNavPanel badgeCounts={badgeCounts} searchInputId="admin-nav-search-desktop" />
          </div>
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
