"use client";

import Link from "next/link";
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
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import {
  formatMembershipEuro,
  KIT_FEE_EUR,
  MEMBERSHIP_EXCLUDES,
  MEMBERSHIP_INCLUDES,
  MEMBERSHIP_PAYMENT_OPTIONS,
  MEMBERSHIP_SEASON_LABEL,
  MEMBERSHIP_TEAM_FEES_2026_27,
} from "@/lib/membership-2026-27";

function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
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

function MembershipFeesTable() {
  return (
    <div className="overflow-hidden border border-white/10 bg-jackals-surface/90">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-jackals-inset/40">
              <th className="px-4 py-3 font-semibold uppercase tracking-wide text-zinc-500 sm:px-6">
                Team
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide text-zinc-500 sm:px-6">
                Training night
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide text-zinc-500 sm:px-6">
                Adult
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wide text-zinc-500 sm:px-6">
                Student / U18
              </th>
            </tr>
          </thead>
          <tbody>
            {MEMBERSHIP_TEAM_FEES_2026_27.map((team) => (
              <tr
                key={team.id}
                className="border-b border-white/10 last:border-0 even:bg-jackals-inset/20"
              >
                <td className="px-4 py-4 sm:px-6">
                  <p className="font-display text-base font-bold text-white sm:text-lg">
                    {team.team}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{team.league}</p>
                </td>
                <td className="px-4 py-4 text-zinc-300 sm:px-6">{team.trainingNight}</td>
                <td className="px-4 py-4 font-display text-xl font-bold text-jackals-red-light sm:px-6">
                  {formatMembershipEuro(team.adultFee)}
                </td>
                <td className="px-4 py-4 font-display text-xl font-bold text-white sm:px-6">
                  {formatMembershipEuro(team.studentFee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-zinc-500 sm:px-6">
        National League squads host ~7 home matchdays at Luttrellstown; Regional Men
        host ~4. Amounts above are the full season total.
      </p>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/contact">
              <Button>Questions? Contact us</Button>
            </Link>
            <Link href="/trials">
              <Button variant="outline">Trials & joining</Button>
            </Link>
          </div>
        }
      />

      <section className="border-b border-white/10 bg-jackals-inset/20 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              How to join
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Kit first, then season membership for your team.
            </p>
          </AnimateIn>
          <StaggerIn className="mt-10 grid gap-4 md:grid-cols-2" stagger={80}>
            <StepCard
              step={1}
              icon={Shirt}
              title={`Club kit · ${formatMembershipEuro(KIT_FEE_EUR)}`}
              description="Custom sublimated Legea kit. Everyone buys kit before membership opens — separate from the fees below."
            />
            <StepCard
              step={2}
              icon={Volleyball}
              title="Season membership"
              description="Covers your weekly training night and your team's home matchdays for Oct–May. Choose how you pay below."
            />
          </StaggerIn>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              2026/27 fees
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Membership is priced by team. Your fee covers weekly training at Meakstown
              and your squad&apos;s home matchdays when the club hosts at Luttrellstown.
            </p>
          </AnimateIn>
          <AnimateIn variant="fade-up" className="mx-auto mt-10 max-w-4xl">
            <MembershipFeesTable />
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
              description="Hall and coach for your squad's weekly session through the season."
            />
            <ValuePillar
              icon={Trophy}
              title="Your home games"
              description="Luttrellstown on Sundays when the club hosts — hall, setup, and matchday costs for your fixtures."
            />
            <ValuePillar
              icon={Volleyball}
              title="Your full season"
              description="Structured league volleyball from October through May — less than booking a hall yourself, with teammates and coaching included."
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
