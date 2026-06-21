"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LogIn, LogOut, Menu, Settings, User, X, Zap } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { NavLinks } from "@/components/layout/NavLinks";
import { Button } from "@/components/ui/Button";

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
    return (
      <>
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={
              variant === "desktop"
                ? "flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-jackals-red-light transition-colors hover:bg-white/5"
                : "flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-jackals-red-light"
            }
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
        )}
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={
            variant === "desktop"
              ? "flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              : "flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-400"
          }
        >
          <User className="h-4 w-4" />
          {variant === "desktop" ? session.user.name?.split(" ")[0] : "Dashboard"}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={
            variant === "desktop"
              ? "flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              : "flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-500"
          }
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
        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-400"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
      <Link
        href="/register"
        onClick={onNavigate}
        className="bg-jackals-red px-3 py-2.5 text-center text-sm font-semibold text-white"
      >
        Join the club
      </Link>
    </>
  );
}

export function Header({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-md">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent" />
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="nav" showText className="min-w-[52px] shrink-0" />

        <nav className="hidden items-center gap-0.5 md:flex">
          <NavLinks
            pathname={pathname}
            variant="desktop"
            isLoggedIn={Boolean(session?.user)}
          />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <AuthActions session={session} variant="desktop" />
        </div>

        <button
          className="p-2 text-zinc-400 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/10 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLinks
              pathname={pathname}
              onNavigate={closeMobile}
              variant="mobile"
              isLoggedIn={Boolean(session?.user)}
            />
            <hr className="my-2 border-white/10" />
            <AuthActions session={session} onNavigate={closeMobile} variant="mobile" />
          </div>
        </nav>
      )}
    </header>
  );
}
