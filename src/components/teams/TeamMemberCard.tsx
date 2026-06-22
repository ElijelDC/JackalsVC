"use client";

import Image from "next/image";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CaptainBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-jackals-red/50 bg-jackals-red/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-jackals-red-light shadow-[0_0_20px_rgba(232,34,42,0.2)]",
        className,
      )}
    >
      <Crown className="h-3 w-3 shrink-0" aria-hidden />
      Captain
    </span>
  );
}

export function TeamMemberCard({
  name,
  subtitle,
  photoUrl,
  variant = "player",
  isCaptain = false,
  className,
}: {
  name: string;
  subtitle?: string | null;
  photoUrl?: string | null;
  variant?: "coach" | "player";
  isCaptain?: boolean;
  className?: string;
}) {
  const isCoach = variant === "coach";

  return (
    <article
      className={cn(
        "motion-hover-lift group relative overflow-hidden text-center",
        isCoach
          ? "border border-white/10 bg-jackals-surface/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] hover:border-jackals-red/40 hover:shadow-[0_24px_70px_rgba(232,34,42,0.12)]"
          : isCaptain
            ? "border border-jackals-red/40 bg-jackals-surface/80 p-4 shadow-[0_12px_40px_rgba(232,34,42,0.12)] hover:border-jackals-red/55 hover:bg-jackals-surface/90 sm:p-6"
            : "border border-white/10 bg-jackals-surface/70 p-4 hover:border-jackals-red/30 hover:bg-jackals-surface/90 sm:p-6",
        className,
      )}
    >
      {isCoach && (
        <>
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-jackals-red/10 blur-3xl opacity-60 transition-opacity group-hover:opacity-100"
          />
        </>
      )}

      <div
        className={cn(
          "relative mx-auto overflow-hidden rounded-full bg-jackals-inset ring-2 transition-all duration-300",
          isCoach
            ? "h-32 w-32 shadow-[0_12px_40px_rgba(232,34,42,0.2)] ring-white/10 group-hover:ring-jackals-red/50 sm:h-36 sm:w-36"
            : isCaptain
              ? "h-20 w-20 shadow-[0_8px_32px_rgba(232,34,42,0.25)] ring-jackals-red/60 ring-offset-2 ring-offset-jackals-surface group-hover:ring-jackals-red-light/80 sm:h-28 sm:w-28"
              : "h-20 w-20 shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-white/10 group-hover:ring-jackals-red/50 sm:h-28 sm:w-28",
        )}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes={isCoach ? "144px" : "(max-width: 640px) 80px, 112px"}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-jackals-red/20 to-jackals-red/5 font-display text-lg font-bold text-jackals-red-light sm:text-2xl">
            {getInitials(name)}
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      <p
        className={cn(
          "mt-3 font-display font-semibold text-white sm:mt-5",
          isCoach ? "text-xl sm:text-2xl" : "line-clamp-2 text-sm leading-snug sm:text-lg",
        )}
      >
        {name}
      </p>
      {subtitle && (
        <p
          className={cn(
            "mt-1.5 font-medium uppercase tracking-wide text-jackals-red-light",
            isCoach ? "text-sm" : "text-xs",
          )}
        >
          {subtitle}
        </p>
      )}
      {isCaptain && !isCoach && (
        <div className="mt-2 flex justify-center sm:mt-2.5">
          <CaptainBadge className="px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px]" />
        </div>
      )}
    </article>
  );
}

export function TeamMemberAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-11 w-11 overflow-hidden rounded-full border-2 border-background ring-2 ring-jackals-red/30",
        className,
      )}
      title={name}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill className="object-cover" sizes="44px" />
      ) : (
        <div className="flex h-full items-center justify-center bg-jackals-red/20 text-xs font-bold text-jackals-red-light">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
