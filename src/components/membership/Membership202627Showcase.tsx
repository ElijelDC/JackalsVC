"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  Shirt,
  Trophy,
  Volleyball,
  Wallet,
  X,
} from "lucide-react";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { MembershipMerchCollapsible } from "@/components/membership/MembershipMerchGallery";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import {
  formatMembershipEuro,
  KIT_FEE_EUR,
  KIT_PAYMENT_DUE,
  MEMBERSHIP_FEES_BY_LEAGUE_INTRO,
  MEMBERSHIP_EXCLUDES,
  MEMBERSHIP_INCLUDES,
  MEMBERSHIP_LEAGUE_COVERAGE_COPY,
  MEMBERSHIP_LEAGUE_TIERS_2026_27,
  MEMBERSHIP_PAYMENT_OPTIONS,
  MEMBERSHIP_SEASON_LABEL,
  type MembershipLeagueTier202627,
} from "@/lib/membership-2026-27";
import { cn } from "@/lib/utils";

function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: ReactNode;
  icon: typeof Shirt;
}) {
  return (
    <div className="relative overflow-hidden border border-white/10 bg-jackals-surface/90 p-6">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
      />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-jackals-red-light">
            Step {step}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function LeagueMembershipCard({ tier }: { tier: MembershipLeagueTier202627 }) {
  const isNationalLeague = tier.league === "National League";

  return (
    <article className="relative flex h-full flex-col overflow-hidden border border-white/10 bg-jackals-surface/90">
      <div
        aria-hidden
        className={cn(
          "h-1.5 w-full",
          isNationalLeague
            ? "bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
            : "bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-500",
        )}
      />
      <div className="flex flex-1 flex-col p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {tier.league}
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold text-white">{tier.name}</h3>
          <p className="mt-2 text-sm text-zinc-400">{tier.squads}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="border border-white/10 bg-jackals-inset/40 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Adult</p>
            <p className="mt-1 font-display text-3xl font-bold text-jackals-red-light">
              {formatMembershipEuro(tier.adultFee)}
            </p>
          </div>
          <div className="border border-white/10 bg-jackals-inset/40 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Student / U18</p>
            <p className="mt-1 font-display text-3xl font-bold text-white">
              {formatMembershipEuro(tier.studentFee)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function MembershipIncludesCard() {
  return (
    <article className="relative flex flex-col overflow-hidden border border-white/10 bg-jackals-surface/90">
      <div
        aria-hidden
        className="h-1.5 w-full bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
      />
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          What every membership includes
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
          {MEMBERSHIP_LEAGUE_COVERAGE_COPY}
        </p>
      </div>
    </article>
  );
}

function LeagueFeesComparison() {
  return (
    <div className="mx-auto mt-10 max-w-4xl space-y-6">
      <StaggerIn className="grid gap-6 md:grid-cols-2" stagger={100}>
        {MEMBERSHIP_LEAGUE_TIERS_2026_27.map((tier) => (
          <LeagueMembershipCard key={tier.id} tier={tier} />
        ))}
      </StaggerIn>
      <MembershipIncludesCard />
      <MembershipMerchCollapsible />
    </div>
  );
}

function PaymentOptionCard({
  label,
  summary,
  description,
}: {
  label: string;
  summary: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col border border-white/10 bg-jackals-surface/90 p-6">
      <div className="flex items-start justify-between gap-3">
        <Wallet className="h-6 w-6 shrink-0 text-jackals-red-light" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {summary}
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl font-bold text-white">{label}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

function ValuePillar({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="border border-white/10 bg-jackals-inset/30 p-5 sm:p-6">
      <Icon className="h-7 w-7 text-jackals-red-light" aria-hidden />
      <h3 className="mt-4 font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

export function Membership202627Showcase() {
  return (
    <>
      <ShowcaseHero
        title="2026/27"
        highlight="Membership"
        description={`${MEMBERSHIP_SEASON_LABEL}. Your squad, your season.`}
        cta={
          <Link href="/contact">
            <Button>Questions? Contact us</Button>
          </Link>
        }
      />

      <section className="border-b border-white/10 bg-jackals-inset/20 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Kit &amp; membership
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Your season has two parts — club kit and squad membership. They&apos;re
              priced and paid separately; here&apos;s what each covers.
            </p>
          </AnimateIn>
          <StaggerIn className="mt-10 grid gap-4 md:grid-cols-2" stagger={80}>
            <StepCard
              step={1}
              icon={Shirt}
              title={`Club kit · ${formatMembershipEuro(KIT_FEE_EUR)}`}
              description={`Premium Jackal-Legea club kit — custom sublimated jersey and shorts for the squad. Kit payment due ${KIT_PAYMENT_DUE}. Priced separately from the season fees below.`}
            />
            <StepCard
              step={2}
              icon={Volleyball}
              title="Season membership"
              description="Covers your squad's league season from October through April. Choose how you pay below."
            />
          </StaggerIn>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Fees by league
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              {MEMBERSHIP_FEES_BY_LEAGUE_INTRO}
            </p>
          </AnimateIn>
          <AnimateIn variant="fade-up">
            <LeagueFeesComparison />
          </AnimateIn>
        </div>
      </section>

      <section className="border-y border-white/10 bg-jackals-inset/20 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Ways to pay
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              When membership opens, you pick one schedule — three instalments or pay in full.
              Same season total; different timing.
            </p>
          </AnimateIn>
          <StaggerIn className="mt-10 grid gap-4 md:grid-cols-2 md:max-w-3xl md:mx-auto" stagger={80}>
            {MEMBERSHIP_PAYMENT_OPTIONS.map((option) => (
              <PaymentOptionCard
                key={option.id}
                label={option.label}
                summary={option.summary}
                description={option.description}
              />
            ))}
          </StaggerIn>
        </div>
      </section>

      <section className="border-b border-white/10 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              What your membership pays for
            </h2>
          </AnimateIn>
          <StaggerIn className="mt-10 grid gap-4 md:grid-cols-3" stagger={80}>
            <ValuePillar
              icon={CalendarDays}
              title="Weekly training"
              description="Your squad's weekly session at Meakstown — hall time, coaching, and structure through the season."
            />
            <ValuePillar
              icon={Trophy}
              title="Your home games"
              description="Luttrellstown on Sundays when the club hosts — hall, setup, and matchday costs for your fixtures."
            />
            <ValuePillar
              icon={Volleyball}
              title="Your full season"
              description="Structured league volleyball from October through April — less than booking a hall yourself, with teammates and coaching included."
            />
          </StaggerIn>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <AnimateIn variant="fade-up">
              <div className="h-full border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-white">Included</h2>
                <ul className="mt-5 space-y-3">
                  {MEMBERSHIP_INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
            <AnimateIn variant="fade-up">
              <div className="h-full border border-white/10 bg-jackals-surface/60 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-white">Not included</h2>
                <ul className="mt-5 space-y-3">
                  {MEMBERSHIP_EXCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>
    </>
  );
}
