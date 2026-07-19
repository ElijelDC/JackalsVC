import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { cn } from "@/lib/utils";
import type {
  PlayoffBracket,
  TournamentArchiveEntry,
} from "@/lib/tournament-archive";

const PLACE_STYLES: Record<
  1 | 2 | 3,
  { metal: string; ring: string; label: string; size: string; numSize: string }
> = {
  1: {
    metal: "from-amber-300 via-yellow-500 to-amber-700",
    ring: "ring-amber-400/50",
    label: "Champions",
    size: "h-20 w-20 sm:h-24 sm:w-24",
    numSize: "text-3xl sm:text-4xl",
  },
  2: {
    metal: "from-zinc-200 via-zinc-400 to-zinc-600",
    ring: "ring-zinc-300/40",
    label: "Runners-up",
    size: "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]",
    numSize: "text-2xl sm:text-3xl",
  },
  3: {
    metal: "from-orange-300 via-amber-700 to-orange-950",
    ring: "ring-orange-400/40",
    label: "3rd place",
    size: "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]",
    numSize: "text-2xl sm:text-3xl",
  },
};

function PodiumSlot({
  place,
  team,
  featured,
  championLabel,
}: {
  place: 1 | 2 | 3;
  team: string;
  featured?: boolean;
  championLabel?: string;
}) {
  const style = PLACE_STYLES[place];
  const label =
    place === 1 && championLabel ? championLabel : style.label;

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        featured && "order-first sm:order-none sm:-mt-6",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-[0_0_40px_rgba(232,34,42,0.15)] ring-2",
          style.metal,
          style.ring,
          style.size,
        )}
      >
        <span
          className={cn(
            "font-display font-bold leading-none text-black/85",
            style.numSize,
          )}
        >
          {place}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
        {label}
      </p>
      <h3
        className={cn(
          "mt-2 font-display font-bold uppercase tracking-wide text-white",
          place === 1 ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
        )}
      >
        {team}
      </h3>
    </div>
  );
}

function PodiumGrid({
  podium,
  title,
  subtitle,
  description,
  championLabel,
}: {
  podium: TournamentArchiveEntry["podium"];
  title: string;
  subtitle?: string;
  description?: string;
  championLabel?: string;
}) {
  const first = podium.find((p) => p.place === 1);
  const second = podium.find((p) => p.place === 2);
  const third = podium.find((p) => p.place === 3);
  const twoOnly = Boolean(first && second && !third);

  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
      <AnimateIn variant="blur-in" className="mb-12 text-center sm:mb-14">
        {subtitle ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            {subtitle}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-display text-3xl font-bold text-white sm:text-4xl",
            subtitle && "mt-3",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {description}
          </p>
        ) : null}
      </AnimateIn>

      <StaggerIn
        className={cn(
          "grid items-end gap-10 sm:gap-6",
          twoOnly
            ? "mx-auto max-w-lg grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-3",
        )}
        stagger={90}
        variant="pop"
      >
        {twoOnly ? (
          <>
            {first ? (
              <PodiumSlot
                place={1}
                team={first.team}
                championLabel={championLabel}
              />
            ) : null}
            {second ? (
              <PodiumSlot
                place={2}
                team={second.team}
                championLabel={championLabel}
              />
            ) : null}
          </>
        ) : (
          <>
            {second ? (
              <PodiumSlot place={2} team={second.team} />
            ) : null}
            {first ? (
              <PodiumSlot place={1} team={first.team} featured />
            ) : null}
            {third ? <PodiumSlot place={3} team={third.team} /> : null}
          </>
        )}
      </StaggerIn>
    </div>
  );
}

export function TournamentPodium({
  podium,
  brackets,
}: {
  podium: TournamentArchiveEntry["podium"];
  brackets?: PlayoffBracket[];
}) {
  if (brackets && brackets.length > 0) {
    return (
      <section className="relative overflow-hidden border-b border-white/10 bg-jackals-red/5 py-16 sm:py-20">
        <div
          aria-hidden
          className="motion-ambient-orb pointer-events-none absolute left-1/4 top-0 h-48 w-48 rounded-full bg-jackals-red/15 blur-3xl"
        />
        <div
          aria-hidden
          className="motion-ambient-orb pointer-events-none absolute bottom-0 right-1/5 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
        />

        <div className="relative space-y-16 sm:space-y-20">
          {brackets.map((bracket) => (
            <PodiumGrid
              key={bracket.key}
              podium={bracket.podium}
              subtitle="Final standings"
              title={bracket.name}
              description={
                bracket.key === "rose-cup"
                  ? "Cup champions and runners-up — no 3rd-place playoff."
                  : bracket.key === "rose-shield"
                    ? "Shield champions and runners-up — no 3rd-place playoff."
                    : undefined
              }
              championLabel={
                bracket.key === "rose-shield" ? "Shield winners" : "Cup winners"
              }
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-jackals-red/5 py-16 sm:py-20">
      <div
        aria-hidden
        className="motion-ambient-orb pointer-events-none absolute left-1/4 top-0 h-48 w-48 rounded-full bg-jackals-red/15 blur-3xl"
      />
      <div
        aria-hidden
        className="motion-ambient-orb pointer-events-none absolute bottom-0 right-1/5 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
      />

      <PodiumGrid
        podium={podium}
        subtitle="Final standings"
        title="Champions podium"
        description="The teams who climbed the sand and claimed the day."
      />
    </section>
  );
}
