import Image from "next/image";
import Link from "next/link";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import type { TournamentArchiveEntry } from "@/lib/tournament-archive";
import { cn } from "@/lib/utils";

const PLACE_META: Record<
  1 | 2 | 3,
  {
    label: string;
    metal: string;
    bar: string;
    glow: string;
    step: string;
  }
> = {
  1: {
    label: "Champions",
    metal: "from-amber-200 via-yellow-400 to-amber-600",
    bar: "from-amber-400/80 via-yellow-300 to-amber-500/80",
    glow: "shadow-[0_0_48px_rgba(251,191,36,0.35)]",
    step: "h-28 sm:h-36",
  },
  2: {
    label: "Runners-up",
    metal: "from-zinc-100 via-zinc-300 to-zinc-500",
    bar: "from-zinc-300/70 via-zinc-200 to-zinc-400/70",
    glow: "shadow-[0_0_32px_rgba(212,212,216,0.2)]",
    step: "h-20 sm:h-28",
  },
  3: {
    label: "3rd place",
    metal: "from-orange-300 via-amber-700 to-orange-950",
    bar: "from-orange-500/70 via-amber-600 to-orange-800/70",
    glow: "shadow-[0_0_32px_rgba(217,119,6,0.25)]",
    step: "h-16 sm:h-24",
  },
};

function OverviewPodium({
  entry,
}: {
  entry: TournamentArchiveEntry;
}) {
  const podium = entry.podium;
  const first = podium.find((p) => p.place === 1);
  const second = podium.find((p) => p.place === 2);
  const third = podium.find((p) => p.place === 3);
  const twoOnly = Boolean(first && second && !third);
  const ordered = (
    twoOnly
      ? [
          first ? { ...first, place: 1 as const } : null,
          second ? { ...second, place: 2 as const } : null,
        ]
      : [
          second ? { ...second, place: 2 as const } : null,
          first ? { ...first, place: 1 as const } : null,
          third ? { ...third, place: 3 as const } : null,
        ]
  ).filter(Boolean) as { place: 1 | 2 | 3; team: string }[];
  const shield = entry.brackets?.find((b) => b.key === "rose-shield");
  const shieldFirst = shield?.podium.find((p) => p.place === 1);
  const shieldSecond = shield?.podium.find((p) => p.place === 2);
  const heading = entry.brackets?.length ? "Rose Cup podium" : "Final podium";

  return (
    <div className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-jackals-red/[0.08] via-black/40 to-black/60 px-4 py-10 sm:px-8 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/60 to-transparent"
      />
      <div
        aria-hidden
        className="motion-ambient-orb pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl"
      />

      <p className="relative text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-jackals-red-light">
        {heading}
      </p>

      <div
        className={cn(
          "relative mx-auto mt-8 flex items-end justify-center gap-2 sm:mt-10 sm:gap-4",
          ordered.length <= 2 ? "max-w-md" : "max-w-xl",
        )}
      >
        {ordered.map((slot) => {
          const meta = PLACE_META[slot.place];
          const isChamp = slot.place === 1;
          return (
            <div
              key={slot.place}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center",
                isChamp && ordered.length > 2 && "z-10 -mt-2 sm:-mt-4",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full bg-gradient-to-br ring-2 ring-white/20",
                  meta.metal,
                  meta.glow,
                  isChamp
                    ? "h-14 w-14 sm:h-16 sm:w-16"
                    : "h-11 w-11 sm:h-12 sm:w-12",
                )}
              >
                <span
                  className={cn(
                    "font-display font-bold leading-none text-black/85",
                    isChamp ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
                  )}
                >
                  {slot.place}
                </span>
              </div>

              <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
                {meta.label}
              </p>
              <p
                className={cn(
                  "mt-1 max-w-full truncate px-1 text-center font-display font-bold uppercase tracking-wide text-white",
                  isChamp
                    ? "text-base sm:text-xl"
                    : "text-sm sm:text-base",
                )}
              >
                {slot.team}
              </p>

              <div
                className={cn(
                  "mt-4 w-full overflow-hidden border border-white/10 bg-white/[0.04]",
                  meta.step,
                )}
              >
                <div
                  className={cn(
                    "h-1 w-full bg-gradient-to-r",
                    meta.bar,
                  )}
                />
                <div className="flex h-[calc(100%-0.25rem)] items-end justify-center pb-2">
                  <span
                    className={cn(
                      "font-display font-bold tabular-nums text-white/15",
                      isChamp ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl",
                    )}
                  >
                    {slot.place}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {shieldFirst ? (
        <div className="relative mx-auto mt-8 max-w-lg border-t border-white/10 pt-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Rose Shield
          </p>
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-wide text-white sm:text-base">
            {shieldFirst.team}
            <span className="mx-2 text-zinc-600">·</span>
            <span className="text-zinc-400">1st</span>
            {shieldSecond ? (
              <>
                <span className="mx-2 text-zinc-600">·</span>
                {shieldSecond.team}
                <span className="ml-2 text-zinc-500">2nd</span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function FeaturedTournamentCard({
  entry,
}: {
  entry: TournamentArchiveEntry;
}) {
  return (
    <Link
      href={`/tournaments/${entry.slug}`}
      className="motion-hover-lift motion-shine group relative block overflow-hidden border border-white/10 bg-jackals-surface/80 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/45 hover:shadow-[0_24px_70px_rgba(232,34,42,0.18)]"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
      />

      <div className="relative aspect-[2.2/1] overflow-hidden">
        {entry.coverImage ? (
          <Image
            src={entry.coverImage}
            alt={`${entry.title} cover`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            sizes="(max-width: 1024px) 100vw, 1100px"
            priority
            unoptimized={entry.coverImage.startsWith("/uploads/")}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-jackals-red/40 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(232,34,42,0.35),transparent_70%)]"
        />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-8 sm:pb-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex bg-jackals-red px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
              Completed
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-jackals-red-light sm:text-xs">
              {entry.dateLabel}
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide text-white drop-shadow-sm sm:text-4xl">
            {entry.title}
          </h2>
          <p className="mt-2 text-sm text-zinc-300 sm:text-base">
            {entry.location}
          </p>
        </div>
      </div>

      {entry.podium.length > 0 ? <OverviewPodium entry={entry} /> : null}

      <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
          {entry.blurb}
        </p>
        <span className="motion-cta-glow inline-flex shrink-0 self-start bg-jackals-red px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors group-hover:bg-jackals-red-light sm:self-auto">
          View full results
        </span>
      </div>
    </Link>
  );
}

export function OurTournamentsShowcase({
  tournaments,
}: {
  tournaments: TournamentArchiveEntry[];
}) {
  return (
    <>
      <ShowcaseHero
        title="Our"
        highlight="Tournaments"
        description="Club-hosted events on the sand and court — champions, standings, and the moments that made the day."
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Archive
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Hosted by Jackals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Dive into past tournaments — pool tables, play-off scores, and the
            teams who took home the hardware.
          </p>
        </AnimateIn>

        {tournaments.length === 0 ? (
          <p className="text-center text-zinc-500">
            Tournament archive coming soon.
          </p>
        ) : (
          <StaggerIn className="flex flex-col gap-10" stagger={120} variant="pop">
            {tournaments.map((entry) => (
              <FeaturedTournamentCard key={entry.slug} entry={entry} />
            ))}
          </StaggerIn>
        )}
      </div>
    </>
  );
}
