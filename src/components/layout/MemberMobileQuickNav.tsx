"use client";

import Link from "next/link";
import {
  isAdminQuickNavActive,
  isNavItemActive,
  visibleMemberMobileQuickNavItems,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MemberMobileQuickNav({
  pathname,
  isLoggedIn,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
}: {
  pathname: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isCoach?: boolean;
  isPaidCoach?: boolean;
}) {
  const items = visibleMemberMobileQuickNavItems(
    isLoggedIn,
    isAdmin,
    isCoach,
    isPaidCoach,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={isAdmin ? "Admin quick links" : "Member quick links"}
      className="flex min-w-0 shrink items-center justify-end gap-0.5 sm:gap-1 lg:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          isAdmin && href === "/admin"
            ? isAdminQuickNavActive(pathname, href)
            : isNavItemActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "motion-nav-link flex h-10 w-10 shrink-0 items-center justify-center rounded-sm sm:h-auto sm:w-auto sm:min-w-0 sm:flex-col sm:gap-0.5 sm:px-1.5 sm:py-1.5 sm:text-[11px] sm:font-medium sm:leading-none",
              active
                ? "bg-jackals-red/15 text-jackals-red-light"
                : "text-zinc-400 active:bg-white/5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden max-w-full truncate sm:block">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
