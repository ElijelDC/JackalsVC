"use client";

import Link from "next/link";
import { ShowcaseCard } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const FEES = {
  nl: {
    label: "National League",
    teams: "Division 2 Men · Division 3 Women",
    adult: 385,
    student: 330,
    homeMatches: 7,
  },
  regional: {
    label: "Regional League",
    teams: "Men",
    adult: 345,
    student: 295,
    homeMatches: 4,
  },
  kit: 45,
};

const COSTS = [
  { label: "Training hall — Meakstown", amount: 7440 },
  { label: "Coach pay — training only", amount: 2325 },
  { label: "Home halls — Luttrellstown", amount: 2214 },
  { label: "Referees — home matchdays", amount: 810 },
  { label: "Hall setup on home Sundays", amount: 307 },
] as const;

const totalPool = COSTS.reduce((sum, row) => sum + row.amount, 0);

function euro(n: number) {
  return `€${n.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;
}

function FeeCard({
  label,
  teams,
  adult,
  student,
  homeMatches,
  className,
}: {
  label: string;
  teams: string;
  adult: number;
  student: number;
  homeMatches: number;
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardTitle>{label}</CardTitle>
      <CardDescription className="mt-1 text-zinc-400">{teams}</CardDescription>
      <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
        ~{homeMatches} home matches each
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-jackals-inset/40 p-3">
          <dt className="text-xs text-zinc-500">Adult</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-jackals-red-light">
            {euro(adult)}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-jackals-inset/40 p-3">
          <dt className="text-xs text-zinc-500">Student / U18</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-white">
            {euro(student)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function DataTable({
  headers,
  rows,
  columnAlign = [],
}: {
  headers: string[];
  rows: string[][];
  columnAlign?: Array<"left" | "right" | undefined>;
}) {
  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "whitespace-nowrap px-3 py-2 font-medium first:pl-0 last:pr-0",
                  columnAlign[index] === "right" && "text-right",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-white/5 last:border-0"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-3 py-3 text-zinc-300 first:pl-0 last:pr-0",
                    cellIndex === 0 && "text-white",
                    columnAlign[cellIndex] === "right" && "text-right tabular-nums",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MembershipFees202627Showcase() {
  return (
    <>
      <ShowcaseHero
        title="2026/27"
        highlight="Membership fees"
        description="October 2026 – May 2027 · honest breakdown of what you pay and where the money goes."
        cta={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/contact">
              <Button>Questions? Contact us</Button>
            </Link>
            <Link href="/events">
              <Button variant="outline">See upcoming events</Button>
            </Link>
          </div>
        }
      />

      <section className="border-b border-white/10 bg-jackals-inset/20 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up">
            <div className="mx-auto max-w-3xl rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold text-white">
                Two steps to join
              </h2>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                <li>
                  <span className="font-semibold text-white">1.</span> Buy club
                  kit first (~{euro(FEES.kit)}) — mandatory before membership
                  opens.
                </li>
                <li>
                  <span className="font-semibold text-white">2.</span> Pay season
                  membership (Oct–May) — covers training and your team&apos;s home
                  matchdays.
                </li>
              </ol>
            </div>
          </AnimateIn>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up" className="text-center">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Season fees
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              National League teams play more home games (~7 each), so those fees
              are slightly higher. Regional plays ~4 home games. Same training,
              same club — fair share of extra hall and referee costs.
            </p>
          </AnimateIn>

          <StaggerIn className="mt-8 grid gap-4 sm:grid-cols-2">
            <FeeCard {...FEES.nl} />
            <FeeCard {...FEES.regional} />
          </StaggerIn>
        </div>
      </section>

      <section className="border-y border-white/10 bg-jackals-inset/20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <ShowcaseCard title="What's included" interactive={false}>
              <ul className="space-y-2">
                <li>Training at Meakstown (Mon / Wed / Fri), October–May</li>
                <li>Home matchday costs for your team at Luttrellstown</li>
                <li>Coach pay for training sessions (not match days)</li>
                <li>
                  Small club reserve (~{euro(500)} for the season) for catch-up
                  sessions or minor overruns
                </li>
                <li>93 training sessions planned after breaks and bank holidays</li>
              </ul>
            </ShowcaseCard>

            <ShowcaseCard title="What's not included" interactive={false}>
              <ul className="space-y-2">
                <li>Club kit (~{euro(FEES.kit)})</li>
                <li>Volleyball Ireland affiliation (club covers separately)</li>
                <li>Cup matches, playoffs, or fun sessions</li>
                <li>Travel to away matches</li>
                <li>Equipment beyond your kit</li>
              </ul>
            </ShowcaseCard>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="fade-up">
            <ShowcaseCard title="Where the money goes (~42 members)" interactive={false}>
              <p className="mb-4">
                Whole-club costs for one season, using worst-case hired referees
                for every home match.
              </p>
              <DataTable
                headers={["Category", "Approx. cost"]}
                columnAlign={["left", "right"]}
                rows={[
                  ...COSTS.map((row) => [row.label, euro(row.amount)]),
                  ["Total membership pool", euro(totalPool)],
                ]}
              />
              <p className="mt-4 text-xs text-zinc-500">
                Kit (~{euro(FEES.kit)} × 42 ≈ {euro(FEES.kit * 42)}) is collected
                separately before membership.
              </p>
            </ShowcaseCard>
          </AnimateIn>
        </div>
      </section>

      <section className="border-t border-white/10 bg-jackals-inset/20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <ShowcaseCard title="Home matchdays — Luttrellstown" interactive={false}>
              <p className="mb-4">
                When we host at home: 30 minutes setup once per home Sunday, then
                2.5 hours per match on court.
              </p>
              <DataTable
                headers={["Home Sunday", "Booking"]}
                rows={[
                  ["1 team home", "0.5h setup + 2.5h × 1 match"],
                  ["2 teams home", "0.5h setup + 2.5h × 2 matches"],
                  ["All 3 teams home", "0.5h setup + 2.5h × 3 matches"],
                ]}
              />
              <p className="mt-4">
                18 home matches across the club this season: 7 + 7 + 4.
              </p>
            </ShowcaseCard>

            <ShowcaseCard title="Training — Meakstown" interactive={false}>
              <ul className="space-y-2">
                <li>Mon / Wed / Fri at Meakstown</li>
                <li>Off 21 December 2026 – 3 January 2027 (back 4 January)</li>
                <li>No training on Irish bank holidays that fall on those nights</li>
              </ul>
              <p className="mt-4">
                We priced from real hall rates, coach pay, referee costs, and last
                season&apos;s home-game schedule. Fees are set so that even if about
                90% of members are students, the club finishes with roughly{" "}
                {euro(500)} in reserve — not a large profit.
              </p>
            </ShowcaseCard>
          </div>
        </div>
      </section>
    </>
  );
}
