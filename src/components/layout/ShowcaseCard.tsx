import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ShowcaseCard({
  title,
  children,
  className,
  contentClassName,
  padding = true,
  interactive = true,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  padding?: boolean;
  /** When false, skips hover lift and shine sweep (e.g. form cards). */
  interactive?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden border border-white/10 bg-jackals-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        interactive && "motion-hover-pop motion-shine",
        padding && "p-6 sm:p-8",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-jackals-red/10 blur-3xl"
      />
      <div className={cn("relative", contentClassName)}>
        {title ? (
          <>
            <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
            <div className="mt-4 text-sm leading-relaxed text-zinc-400">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </article>
  );
}

export function ShowcaseCtaBand({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface px-6 py-10 sm:px-10 sm:py-12",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(232,34,42,0.2),transparent_60%)]"
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 md:flex-row md:flex-nowrap md:items-center md:justify-end lg:w-auto [&>*]:w-full md:[&>*]:w-auto [&_button]:whitespace-nowrap">
          {children}
        </div>
      </div>
    </div>
  );
}
