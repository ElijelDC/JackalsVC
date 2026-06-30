import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { cn } from "@/lib/utils";

export type ShowcaseStat = {
  icon: LucideIcon;
  value: number | string;
  label: string;
};

export function ShowcaseHero({
  title,
  highlight,
  description,
  stats,
  action,
  className,
  contentClassName,
}: {
  title: string;
  highlight: string;
  description: ReactNode;
  stats?: ShowcaseStat[];
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-white/10 bg-background hero-bg",
        className,
      )}
    >
      <div
        aria-hidden
        className="motion-hero-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 home-hero-grid opacity-30"
      />
      <div
        aria-hidden
        className="motion-ambient-orb pointer-events-none absolute -left-20 top-1/4 h-56 w-56 rounded-full bg-jackals-red/15 blur-3xl"
      />
      <div
        aria-hidden
        className="motion-ambient-orb-delayed pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-jackals-red/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {action}
        <div className={cn("mx-auto max-w-3xl text-center", contentClassName)}>
          <AnimateIn immediate variant="spring-up">
            <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-5xl lg:text-6xl">
              {title}{" "}
              <span className="motion-gradient-text bg-gradient-to-r from-jackals-red-light via-jackals-red to-jackals-red-light bg-clip-text text-transparent">
                {highlight}
              </span>
            </h1>
          </AnimateIn>
          <AnimateIn immediate variant="blur-in" delay={120}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              {description}
            </p>
          </AnimateIn>

          {stats && stats.length > 0 && (
            <StaggerIn
              className={cn(
                "mt-10 grid grid-cols-2 gap-x-4 gap-y-6 text-sm text-zinc-500 sm:mt-12 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-3",
              )}
              stagger={65}
              variant="pop"
            >
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-start gap-1.5 text-left sm:gap-2"
                >
                  <Icon className="motion-icon-pop h-4 w-4 shrink-0 text-jackals-red-light sm:h-5 sm:w-5" />
                  <span>
                    <span className="motion-stat-value font-display text-xl font-bold text-white sm:text-3xl">
                      {value}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-zinc-400 sm:mt-1 sm:text-sm">
                      {label}
                    </span>
                  </span>
                </div>
              ))}
            </StaggerIn>
          )}
        </div>
      </div>
    </section>
  );
}
