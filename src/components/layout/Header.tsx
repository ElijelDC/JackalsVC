"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LogIn, LogOut, Menu, Settings, User, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/layout/Logo";
import { NavLinks } from "@/components/layout/NavLinks";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function AuthActions({
  session,
  onNavigate,
  variant,
}: {
  session: Session | null;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
}) {
  if (session?.user) {
    if (variant === "desktop") {
      return <UserMenu session={session} />;
    }

    return (
      <>
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-2 px-3 py-3 text-sm font-medium text-jackals-red-light active:bg-white/5"
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
        )}
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-2 px-3 py-3 text-sm font-medium text-zinc-400 active:bg-white/5"
        >
          <User className="h-4 w-4" />
          Dashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex min-h-11 items-center gap-2 px-3 py-3 text-sm font-medium text-zinc-500 active:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </>
    );
  }

  if (variant === "desktop") {
    return (
      <>
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
        <Link href="/register">
          <Button size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Join the club
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex min-h-11 items-center gap-2 px-3 py-3 text-sm font-medium text-zinc-400 active:bg-white/5"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
      <Link
        href="/register"
        onClick={onNavigate}
        className="flex min-h-11 items-center justify-center bg-jackals-red px-3 py-3 text-center text-sm font-semibold text-white active:bg-jackals-red/90"
      >
        Join the club
      </Link>
    </>
  );
}

export function Header({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-md",
        mounted && "motion-header-enter",
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent" />
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="nav" showText className="min-w-[52px] shrink-0" />

        <nav className="hidden items-center gap-0.5 lg:flex">
          <NavLinks
            pathname={pathname}
            variant="desktop"
            isLoggedIn={Boolean(session?.user)}
          />
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <AuthActions session={session} variant="desktop" />
        </div>

        <button
          type="button"
          className="-mr-2 p-2.5 text-zinc-400 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="motion-mobile-menu border-t border-white/10 bg-background lg:hidden"
        >
          <div className="flex max-h-[calc(100dvh-4.25rem)] flex-col">
            <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <NavLinks
                  pathname={pathname}
                  onNavigate={closeMobile}
                  variant="mobile"
                  isLoggedIn={Boolean(session?.user)}
                />
              </div>
            </div>
            <div className="shrink-0 border-t border-white/10 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <AuthActions
                  session={session}
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
