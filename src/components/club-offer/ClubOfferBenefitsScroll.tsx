"use client";

import { useEffect, useRef, useState } from "react";
import type { ClubOfferTeam } from "@/lib/club-offer-config";
import type { CoachOfferTeam } from "@/lib/coach-offer-config";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

/** Matches site Header `h-[4.25rem]` so sticky slides pin below it. */
const HEADER_OFFSET_PX = 68;

type BenefitsScrollTeam = ClubOfferTeam | CoachOfferTeam;

export function ClubOfferBenefitsScroll({
  team,
  sectionLabel = "Your season at Jackals",
}: {
  team: BenefitsScrollTeam;
  sectionLabel?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isPurple = team.accent === "purple";

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const viewH = Math.max(window.innerHeight - HEADER_OFFSET_PX, 1);
      const total = Math.max(rect.height - viewH, 1);
      // 0 when section top reaches sticky pin (below header)
      const scrolled = HEADER_OFFSET_PX - rect.top;
      const raw = Math.min(Math.max(scrolled / total, 0), 1);
      setProgress(raw);
      const next = Math.min(
        team.benefits.length - 1,
        Math.floor(raw * team.benefits.length),
      );
      setActiveIndex(next);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [prefersReducedMotion, team.benefits.length]);

  const parallaxY = prefersReducedMotion ? 0 : (progress - 0.5) * 48;

  return (
    <section
      ref={sectionRef}
      className="relative border-y border-white/10 bg-jackals-inset"
      aria-label={`${team.shortName} season experience`}
    >
      {/* Tall track; sticky panel fills viewport under header */}
      <div className="relative h-[calc((100svh-4.25rem)*2.5)] min-h-[220vh]">
        <div className="sticky top-[4.25rem] flex h-[calc(100svh-4.25rem)] items-center overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage: isPurple
                ? "radial-gradient(ellipse 55% 45% at 50% 48%, rgba(147,51,234,0.35), transparent 70%)"
                : "radial-gradient(ellipse 55% 45% at 50% 48%, rgba(232,34,42,0.38), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
          />
          <div
            aria-hidden
            className="club-offer-accent-word pointer-events-none absolute inset-x-0 top-1/2 text-center font-display text-[18vw] font-bold leading-none tracking-tight text-white/[0.045] sm:text-[20vw]"
            style={{ transform: `translateY(calc(-50% + ${parallaxY}px))` }}
          >
            {team.accentWord}
          </div>

          <div className="relative mx-auto w-full max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
              {sectionLabel} ·{" "}
              <span
                className={
                  isPurple ? "text-jackals-purple-light" : "text-jackals-red-light"
                }
              >
                {String(activeIndex + 1).padStart(2, "0")}
              </span>{" "}
              / {String(team.benefits.length).padStart(2, "0")}
            </p>

            <div
              aria-hidden
              className="mx-auto mt-5 h-0.5 w-40 overflow-hidden bg-white/10"
            >
              <div
                className={cn(
                  "h-full transition-[width] duration-300 ease-out",
                  isPurple
                    ? "bg-gradient-to-r from-jackals-purple via-jackals-purple-light to-jackals-purple"
                    : "bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red",
                )}
                style={{
                  width: `${((activeIndex + 1) / team.benefits.length) * 100}%`,
                }}
              />
            </div>

            <div className="relative mt-8 min-h-[7.5rem] sm:mt-10 sm:min-h-[12rem]">
              {team.benefits.map((benefit, index) => {
                const active = index === activeIndex;
                return (
                  <div
                    key={benefit}
                    className={cn(
                      "transition-opacity duration-300",
                      active
                        ? "relative opacity-100"
                        : "pointer-events-none absolute inset-x-0 top-0 opacity-0",
                    )}
                  >
                    <p
                      key={`${benefit}-${activeIndex}`}
                      className={cn(
                        "font-display text-[1.85rem] font-bold uppercase leading-[1.05] tracking-[0.04em] text-white sm:text-6xl md:text-7xl lg:text-8xl",
                        active && !prefersReducedMotion && "club-offer-benefit-active",
                      )}
                    >
                      {benefit}
                    </p>
                    <div
                      aria-hidden
                      className={cn(
                        "mx-auto mt-5 h-1 w-24 sm:mt-6",
                        isPurple ? "bg-jackals-purple" : "bg-jackals-red",
                        active &&
                          !prefersReducedMotion &&
                          "club-offer-benefit-underline",
                      )}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mt-8 space-y-2 text-center text-sm font-medium uppercase tracking-[0.18em] text-zinc-400 sm:mt-10 sm:text-base">
              <p
                className={cn(
                  "whitespace-nowrap",
                  isPurple ? "text-jackals-purple-light" : "text-jackals-red-light",
                )}
              >
                {team.league}
              </p>
              <p className="whitespace-nowrap">
                {team.trainingNight ? (
                  <>
                    {team.trainingNight}
                    <span className="mx-2 text-zinc-600">·</span>
                  </>
                ) : null}
                {team.venue}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
