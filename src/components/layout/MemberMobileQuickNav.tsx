"use client";

import Link from "next/link";
import {
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
      aria-label="Member quick links"
      className="flex min-w-0 flex-1 items-center justify-end gap-0.5 lg:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isNavItemActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "motion-nav-link flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1.5 text-[10px] font-medium leading-none sm:px-1.5 sm:text-[11px]",
              active
                ? "bg-jackals-red/15 text-jackals-red-light"
                : "text-zinc-400 active:bg-white/5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="max-w-full truncate">
              {href === "/training"
                ? "Training"
                : href === "/payments"
                  ? "Payments"
                  : href === "/events"
                    ? "Events"
                    : label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
