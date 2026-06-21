"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  visiblePrimaryNavItems,
  isNavItemActive,
} from "@/lib/navigation";
import { InfoNavDropdown } from "@/components/layout/InfoNavDropdown";

export function NavLinks({
  pathname,
  onNavigate,
  variant = "desktop",
  isLoggedIn = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  isLoggedIn?: boolean;
}) {
  const items = visiblePrimaryNavItems(isLoggedIn);

  return (
    <>
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "motion-nav-link flex items-center font-medium",
            variant === "desktop"
              ? "gap-1.5 px-2.5 py-2 text-sm clip-slash-reverse xl:px-3"
              : "min-h-10 gap-2 px-3 py-2.5 text-sm active:bg-white/5",
            isNavItemActive(pathname, href)
              ? "bg-jackals-red/15 text-jackals-red-light"
              : variant === "desktop"
                ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                : "text-zinc-400",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <InfoNavDropdown
        pathname={pathname}
        onNavigate={onNavigate}
        variant={variant}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
