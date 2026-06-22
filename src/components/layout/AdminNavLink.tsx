"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNavLink({
  pathname,
  onNavigate,
  variant = "desktop",
}: {
  pathname: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const active = pathname.startsWith("/admin");

  if (variant === "mobile") {
    return (
      <Link
        href="/admin"
        onClick={onNavigate}
        className={cn(
          "flex min-h-12 w-full items-center justify-center gap-2.5 px-4 py-3 text-base font-semibold clip-slash transition-all duration-300 active:scale-[0.98]",
          active
            ? "bg-jackals-red text-white shadow-[0_0_28px_rgba(232,34,42,0.5)] ring-1 ring-white/20"
            : "bg-jackals-red text-white shadow-[0_0_20px_rgba(232,34,42,0.35)] hover:bg-jackals-red-hover red-glow-sm",
        )}
      >
        <Settings className="h-5 w-5" />
        Admin Panel
      </Link>
    );
  }

  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold clip-slash transition-all duration-300",
        active
          ? "bg-jackals-red text-white shadow-[0_0_24px_rgba(232,34,42,0.5)] ring-1 ring-white/15"
          : "bg-jackals-red text-white red-glow-sm hover:scale-[1.03] hover:bg-jackals-red-hover hover:shadow-[0_0_24px_rgba(232,34,42,0.45)]",
      )}
    >
      <Settings className="h-4 w-4" />
      Admin Panel
    </Link>
  );
}
