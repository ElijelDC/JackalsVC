"use client";

import { useEffect, useRef, useState } from "react";
import { ClubOfferAcceptForm } from "@/components/club-offer/ClubOfferAcceptForm";
import { ClubOfferBenefitsScroll } from "@/components/club-offer/ClubOfferBenefitsScroll";
import { ClubOfferDeclineForm } from "@/components/club-offer/ClubOfferDeclineForm";
import { OfferHeroLogo } from "@/components/club-offer/OfferHeroLogo";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Button } from "@/components/ui/Button";
import { useIntersectionVisible } from "@/hooks/useIntersectionVisible";
import type { ClubOfferTeam } from "@/lib/club-offer-config";
import { cn } from "@/lib/utils";

type OfferPanel = "accept" | "decline" | null;

export function ClubOfferExperience({ team }: { team: ClubOfferTeam }) {
  const [panel, setPanel] = useState<OfferPanel>(null);
  const formRef = useRef<HTMLElement>(null);
  const { ref: ctaRef, visible: ctaVisible } = useIntersectionVisible<HTMLDivElement>({
    threshold: 0.35,
  });
  const isPurple = team.accent === "purple";

  useEffect(() => {
    if (!panel || !formRef.current) return;
    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [panel]);

  return (
    <div
      className={cn(
        "club-offer-theme bg-background text-foreground",
        isPurple && "club-offer-theme-purple",
      )}
    >
      {/* One viewport below sticky header (4.25rem) — avoids jam with season sticky */}
      <section className="relative flex min-h-[calc(100svh-4.25rem)] flex-col border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-bg absolute inset-0" />
          <div className="home-hero-grid absolute inset-0 opacity-70" />
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 bg-gradient-to-b opacity-95",
              isPurple
                ? "from-jackals-purple/35 via-jackals-purple/10 to-transparent"
                : "from-jackals-red/40 via-jackals-red/15 to-transparent",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "motion-ambient-orb absolute -left-16 top-16 h-72 w-72 rounded-full blur-3xl",
              isPurple ? "bg-jackals-purple/30" : "bg-jackals-red/30",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "motion-ambient-orb-delayed absolute -right-10 bottom-0 h-80 w-80 rounded-full blur-3xl",
              isPurple ? "bg-jackals-purple/20" : "bg-jackals-red/20",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "club-offer-light-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent to-transparent",
              isPurple ? "via-jackals-purple/35" : "via-jackals-red/35",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
              isPurple ? "via-jackals-purple/80" : "via-jackals-red/80",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent",
              isPurple ? "via-jackals-purple/50" : "via-jackals-red/50",
            )}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center overflow-visible px-4 pb-4 pt-10 text-center sm:px-6">
          <OfferHeroLogo accent={team.accent} />

          <AnimateIn immediate variant="pop-in" delay={90}>
            <div
              className={cn(
                "club-offer-stamp inline-flex items-center gap-2 border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em]",
                isPurple
                  ? "border-jackals-purple/55 bg-jackals-purple/15 text-jackals-purple-light shadow-[0_0_32px_rgba(147,51,234,0.35)]"
                  : "border-jackals-red/55 bg-jackals-red/15 text-jackals-red-light shadow-[0_0_32px_rgba(232,34,42,0.4)]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isPurple ? "bg-jackals-purple-light" : "bg-jackals-red-light",
                )}
              />
              {team.heroEyebrow}
            </div>
          </AnimateIn>

          <AnimateIn immediate variant="spring-up" delay={160}>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.92] text-white sm:mt-7 sm:text-7xl md:text-8xl">
              <span className="block bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent">
                {team.heroTitle}
              </span>
              <span
                className={cn(
                  "mt-3 block",
                  isPurple
                    ? "text-jackals-purple-light drop-shadow-[0_0_44px_rgba(147,51,234,0.45)]"
                    : "text-jackals-red-light drop-shadow-[0_0_44px_rgba(232,34,42,0.5)]",
                )}
              >
                {team.heroHighlight}
              </span>
            </h1>
          </AnimateIn>

          <AnimateIn immediate variant="blur-in" delay={260}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:mt-8 sm:text-lg">
              {team.heroSupport}
            </p>
          </AnimateIn>

          <AnimateIn immediate variant="fade-up" delay={340}>
            <p className="relative z-[1] pb-8 pt-2 text-center text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              <span
                className={cn(
                  "inline-block animate-pulse",
                  isPurple ? "text-jackals-purple-light" : "text-jackals-red-light",
                )}
              >
                ↓
              </span>{" "}
              Scroll for your season
            </p>
          </AnimateIn>
        </div>
      </section>

      <ClubOfferBenefitsScroll team={team} />

      <section className="relative overflow-hidden border-b border-white/10 px-4 py-20 sm:px-6 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-95"
          style={{
            backgroundImage: isPurple
              ? "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(147,51,234,0.35), transparent 68%)"
              : "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(232,34,42,0.38), transparent 68%)",
          }}
        />
        <div
          aria-hidden
          className={cn(
            "motion-ambient-orb pointer-events-none absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl",
            isPurple ? "bg-jackals-purple/25" : "bg-jackals-red/25",
          )}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <AnimateIn variant="pop-in">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.28em]",
                isPurple ? "text-jackals-purple-light" : "text-jackals-red-light",
              )}
            >
              Next step
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-5xl">
              {team.closingLine}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Confirm your Club Offer for {team.shortName}, then complete your
              acceptance details below — or decline if you can&apos;t take it up.
            </p>
            {!panel ? (
              <div className="relative mt-12 flex flex-col items-center">
                <div ref={ctaRef} className="relative inline-flex">
                  {ctaVisible ? (
                    <span
                      aria-hidden
                      className={cn(
                        "club-offer-cta-ring pointer-events-none absolute -inset-3 rounded-sm border",
                        isPurple
                          ? "border-jackals-purple/50"
                          : "border-jackals-red/50",
                      )}
                    />
                  ) : null}
                  <Button
                    size="lg"
                    className={cn(
                      "relative px-10 py-3.5 text-base",
                      ctaVisible && "motion-cta-glow",
                      isPurple
                        ? "bg-jackals-purple hover:bg-jackals-purple-hover shadow-[0_0_40px_rgba(147,51,234,0.5)] hover:shadow-[0_0_48px_rgba(147,51,234,0.6)]"
                        : "shadow-[0_0_40px_rgba(232,34,42,0.55)] hover:shadow-[0_0_48px_rgba(232,34,42,0.65)]",
                    )}
                    onClick={() => setPanel("accept")}
                  >
                    {team.confirmLabel}
                  </Button>
                </div>

                <div className="mt-10 flex w-full max-w-sm flex-col items-center border-t border-white/10 pt-8 sm:mt-12 sm:pt-10">
                  <p className="mb-4 text-center text-xs text-zinc-500">
                    Can&apos;t take up this offer?
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="border-white/15 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    onClick={() => setPanel("decline")}
                  >
                    Decline offer
                  </Button>
                </div>
              </div>
            ) : null}
          </AnimateIn>
        </div>
      </section>

      {panel ? (
        <section
          ref={formRef}
          id={panel === "accept" ? "accept-offer" : "decline-offer"}
          className="scroll-mt-24 border-b border-white/10 bg-jackals-surface-muted px-4 pb-[max(6rem,calc(4rem+env(safe-area-inset-bottom)))] pt-16 sm:px-6 sm:pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom)))] sm:pt-20"
        >
          <div className="relative mx-auto max-w-2xl">
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-x-8 -top-8 h-32 bg-gradient-to-b to-transparent",
                isPurple ? "from-jackals-purple/15" : "from-jackals-red/15",
              )}
            />
            <AnimateIn variant="fade-up">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.28em]",
                  isPurple ? "text-jackals-purple-light" : "text-jackals-red-light",
                )}
              >
                {panel === "accept" ? "Acceptance form" : "Decline offer"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">
                {panel === "accept" ? team.formHeading : "Decline this offer"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {panel === "accept"
                  ? team.formSupport
                  : `Tell us you won't be joining ${team.shortName} this season.`}
              </p>
            </AnimateIn>
            <div className="relative mt-10">
              {panel === "accept" ? (
                <ClubOfferAcceptForm team={team} />
              ) : (
                <ClubOfferDeclineForm
                  team={team}
                  onCancel={() => setPanel(null)}
                />
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
