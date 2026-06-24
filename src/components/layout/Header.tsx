"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { Lock, Menu, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { DashboardNavLink } from "@/components/layout/DashboardNavLink";
import { AdminNavLink } from "@/components/layout/AdminNavLink";
import { Logo } from "@/components/layout/Logo";
import { MemberMobileQuickNav } from "@/components/layout/MemberMobileQuickNav";
import { NavLinks } from "@/components/layout/NavLinks";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/Button";
import { useAuthModal } from "@/components/providers/AuthModalProvider";
import { cn } from "@/lib/utils";

function AuthActions({
  session,
  pathname,
  onNavigate,
  variant,
}: {
  session: Session | null;
  pathname: string;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
}) {
  const { openAuth } = useAuthModal();

  if (session?.user) {
    const isAdmin = session.user.role === "ADMIN";
    const isCoach = Boolean(session.user.isCoach);

    if (variant === "desktop") {
      return (
        <div className="flex items-center gap-3">
          <DashboardNavLink pathname={pathname} isCoach={isCoach} />
          {isAdmin && <AdminNavLink pathname={pathname} />}
          <div className="h-6 w-px bg-white/10" aria-hidden />
          <UserMenu session={session} />
        </div>
      );
    }

    return <UserMenu session={session} variant="mobile" onNavigate={onNavigate} />;
  }

  if (variant === "desktop") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-zinc-300 hover:text-white"
        onClick={() => openAuth("signin", "/dashboard")}
      >
        <Lock className="h-3.5 w-3.5" />
        Members Only
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        openAuth("signin", "/dashboard");
        onNavigate?.();
      }}
      className="flex min-h-11 items-center gap-2 px-3 py-3 text-sm font-medium text-jackals-red-light active:bg-white/5"
    >
      <Lock className="h-4 w-4" />
      Members Only
    </button>
  );
}

export function Header({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isCoach = Boolean(session?.user?.isCoach);
  const isPaidCoach = Boolean(session?.user?.isPaidCoach);
  const isLoggedIn = Boolean(session?.user);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;
  const closeMobile = () => setMobileOpenPath(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-jackals-inset/95 backdrop-blur-md",
        mounted && "motion-header-enter",
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent" />
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        {isLoggedIn ? (
          <Logo
            size="nav"
            showText
            className="min-w-[52px] shrink-0"
            active={isLoggedIn && !isAdmin && !isCoach && pathname === "/"}
          />
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-sm text-white"
            aria-label="Jackals VC home"
          >
            <Logo size="nav" href={null} className="shrink-0" />
            <span className="font-display text-lg font-bold tracking-wider text-white sm:text-xl">
              <span className="text-zinc-200">Jackals </span>
              <span className="text-jackals-red">VC</span>
            </span>
          </Link>
        )}

        <MemberMobileQuickNav
          pathname={pathname}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          isCoach={isCoach}
          isPaidCoach={isPaidCoach}
        />

        <nav className="hidden items-center gap-0.5 lg:flex">
          <NavLinks
            pathname={pathname}
            variant="desktop"
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            isCoach={isCoach}
            isPaidCoach={isPaidCoach}
          />
        </nav>

        <div className="hidden items-center lg:flex">
          <AuthActions
            session={session}
            pathname={pathname}
            variant="desktop"
          />
        </div>

        <button
          type="button"
          className="-mr-2 p-2.5 text-zinc-400 lg:hidden"
          onClick={() => setMobileOpenPath(mobileOpen ? null : pathname)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="motion-mobile-menu border-t border-white/10 bg-jackals-inset lg:hidden"
        >
          <div className="flex max-h-[calc(100dvh-4.25rem)] flex-col">
            {session?.user && (
              <div className="shrink-0 space-y-2 border-b border-white/10 px-4 py-3">
                <DashboardNavLink
                  pathname={pathname}
                  onNavigate={closeMobile}
                  variant="mobile"
                  isCoach={isCoach}
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <NavLinks
                  pathname={pathname}
                  onNavigate={closeMobile}
                  variant="mobile"
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                  isCoach={isCoach}
                  isPaidCoach={isPaidCoach}
                />
              </div>
            </div>
            <div className="shrink-0 border-t border-white/10 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <AuthActions
                  session={session}
                  pathname={pathname}
                  onNavigate={closeMobile}
                  variant="mobile"
                />
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
