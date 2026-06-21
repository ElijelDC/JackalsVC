"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  Calendar,
  Camera,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Package,
  PartyPopper,
  Settings,
  ShoppingBag,
  UserCheck,
  Users,
  Volleyball,
} from "lucide-react";
import { SHOP_ENABLED } from "@/lib/features";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/membership", label: "Plans", icon: CreditCard },
  { href: "/admin/members", label: "Members", icon: UserCheck },
  { href: "/admin/training", label: "Weekly training", icon: Dumbbell },
  { href: "/admin/fun-sessions", label: "Fun sessions", icon: PartyPopper },
  { href: "/admin/events", label: "Calendar", icon: Calendar },
  { href: "/admin/reminders", label: "Reminders", icon: Bell },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/gallery", label: "Gallery", icon: Camera },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/teams", label: "Teams", icon: Volleyball },
].filter(
  (link) =>
    SHOP_ENABLED ||
    (link.href !== "/admin/products" && link.href !== "/admin/orders"),
);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-jackals-red-light">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Admin
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Club management
          </h1>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-jackals-red-light"
        >
          ← Back to site
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {ADMIN_LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-jackals-red/15 text-jackals-red-light"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div>{children}</div>
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
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
