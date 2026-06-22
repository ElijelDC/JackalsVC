"use client";

import Link from "next/link";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  isInfoNavActive,
  isNavItemActive,
  visibleMoreNavItems,
} from "@/lib/navigation";

function InfoNavDropdownMobile({
  pathname,
  onNavigate,
  isLoggedIn = false,
  isAdmin = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}) {
  const mobileMemberMenu = isLoggedIn && !isAdmin;
  const moreNavOptions = mobileMemberMenu
    ? ({ mobileMemberMenu: true } as const)
    : undefined;
  const [mobileExpanded, setMobileExpanded] = useState(() =>
    isInfoNavActive(pathname, isLoggedIn, isAdmin, moreNavOptions),
  );
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const isActive = isInfoNavActive(
    pathname,
    isLoggedIn,
    isAdmin,
    moreNavOptions,
  );
  const moreItems = visibleMoreNavItems(isLoggedIn, isAdmin, moreNavOptions);
  const hasActiveChild = moreItems.some((item) =>
    isNavItemActive(pathname, item.href),
  );

  useEffect(() => {
    if (!mobileExpanded) {
      return;
    }

    mobilePanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [mobileExpanded]);

  return (
    <div className="border-t border-white/10 pt-1">
      <button
        type="button"
        aria-expanded={mobileExpanded}
        onClick={() => setMobileExpanded((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-sm px-3 py-3 text-sm font-medium",
          isActive
            ? mobileExpanded
              ? "text-jackals-red-light"
              : "bg-jackals-red/10 text-jackals-red-light"
            : "text-zinc-400",
        )}
      >
        <span className="flex items-center gap-2">
          <MoreHorizontal className="h-4 w-4 shrink-0" />
          More
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            mobileExpanded && "rotate-180",
          )}
        />
      </button>

      {mobileExpanded && (
        <div
          ref={mobilePanelRef}
          className={cn(
            "mb-1 grid grid-cols-2 gap-1.5 px-1",
            hasActiveChild && "mt-1.5",
          )}
        >
          {moreItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "motion-nav-link flex min-h-10 items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-medium leading-tight sm:text-sm",
                isNavItemActive(pathname, href)
                  ? "bg-jackals-red/10 text-jackals-red-light ring-1 ring-inset ring-jackals-red/20"
                  : "text-zinc-400 active:bg-white/5",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0">{label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function InfoNavDropdown({
  pathname,
  onNavigate,
  variant = "desktop",
  isLoggedIn = false,
  isAdmin = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isActive = isInfoNavActive(pathname, isLoggedIn, isAdmin);
  const moreItems = visibleMoreNavItems(isLoggedIn, isAdmin);

  useEffect(() => {
    if (variant !== "desktop") {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  if (variant === "mobile") {
    return (
      <InfoNavDropdownMobile
        key={pathname}
        pathname={pathname}
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "motion-nav-link flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium clip-slash-reverse xl:px-3",
          isActive || open
            ? "bg-jackals-red/15 text-jackals-red-light"
            : "text-zinc-400 hover:bg-white/5 hover:text-white",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
        More
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] border border-white/10 bg-background py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          {moreItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                isNavItemActive(pathname, href)
                  ? "bg-jackals-red/10 text-jackals-red-light"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
