"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { visibleNavItems, isNavItemActive } from "@/lib/navigation";

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
  return (
    <>
      {visibleNavItems(isLoggedIn).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center font-medium transition-colors",
            variant === "desktop"
              ? "gap-1.5 px-3 py-2 text-sm clip-slash-reverse"
              : "gap-2 px-3 py-2.5 text-sm",
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
    </>
  );
}
