"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function UserMenu({ session }: { session: Session }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdmin = session.user.role === "ADMIN";
  const isActive =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");
  const displayName = session.user.name?.split(" ")[0] ?? "Account";

  useEffect(() => {
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
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium clip-slash-reverse",
          isActive || open
            ? "bg-jackals-red/15 text-jackals-red-light"
            : "text-zinc-400 hover:bg-white/5 hover:text-white",
        )}
      >
        <User className="h-4 w-4" />
        {displayName}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-48 border border-white/10 bg-background py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/profile")
                ? "bg-jackals-red/10 text-jackals-red-light"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            Profile
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/dashboard")
                ? "bg-jackals-red/10 text-jackals-red-light"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-jackals-red/10 text-jackals-red-light"
                  : "text-jackals-red-light hover:bg-white/5",
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
