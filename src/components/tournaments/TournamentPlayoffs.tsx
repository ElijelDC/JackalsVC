import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { TournamentSetScores } from "@/components/tournaments/TournamentSetScores";
import { cn } from "@/lib/utils";
import type { PlayoffBracket, PlayoffMatch } from "@/lib/tournament-archive";

function MatchCard({ match, featured }: { match: PlayoffMatch; featured?: boolean }) {
  const winnerIsA = match.winner === match.teamA;

  return (
    <article
      className={cn(
        "relative overflow-hidden border border-white/10 bg-white/[0.02]",
        featured && "border-jackals-red/40 bg-jackals-red/[0.07]",
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/70 to-transparent"
      />
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
            {match.label}
          </p>
          {featured ? (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
              Final
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <div
              className={cn(
                "flex items-center gap-2 border-l-2 pl-3",
                winnerIsA
                  ? "border-jackals-red bg-jackals-red/10 py-2 pr-3"
                  : "border-transparent py-1",
              )}
            >
              {match.seedA ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {match.seedA}
                </span>
              ) : null}
              <span
                className={cn(
                  "font-display text-base font-bold uppercase tracking-wide sm:text-lg",
                  winnerIsA ? "text-white" : "text-zinc-400",
                )}
              >
                {match.teamA}
              </span>
              {winnerIsA ? (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-jackals-red-light">
                  Winner
                </span>
              ) : null}
            </div>
            <div
              className={cn(
                "flex items-center gap-2 border-l-2 pl-3",
                !winnerIsA
                  ? "border-jackals-red bg-jackals-red/10 py-2 pr-3"
                  : "border-transparent py-1",
              )}
            >
              {match.seedB ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {match.seedB}
                </span>
              ) : null}
              <span
                className={cn(
                  "font-display text-base font-bold uppercase tracking-wide sm:text-lg",
                  !winnerIsA ? "text-white" : "text-zinc-400",
                )}
              >
                {match.teamB}
              </span>
              {!winnerIsA ? (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-jackals-red-light">
                  Winner
                </span>
              ) : null}
            </div>
          </div>

          <TournamentSetScores
            sets={match.sets}
            slotCount={Math.max(match.sets.length, 2)}
            winnerIsA={winnerIsA}
          />
        </div>
      </div>
    </article>
  );
}

function BracketMatches({
  matches,
  title,
  blurb,
}: {
  matches: PlayoffMatch[];
  title: string;
  blurb?: string;
}) {
  const final = matches.find((m) => m.round === "final");
  const semis = matches.filter((m) => m.round === "semi");
  const third = matches.find((m) => m.round === "third");

  return (
    <div>
      <AnimateIn variant="blur-in" className="mb-8 text-center sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
          Knockout stage
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h2>
        {blurb ? (
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {blurb}
          </p>
        ) : null}
      </AnimateIn>

      <div className="space-y-4">
        <StaggerIn className="grid gap-4 sm:grid-cols-2" stagger={80} variant="pop">
          {semis.map((match) => (
            <MatchCard key={match.label} match={match} />
          ))}
        </StaggerIn>

        {third ? (
          <AnimateIn variant="spring-up">
            <MatchCard match={third} />
          </AnimateIn>
        ) : null}

        {final ? (
          <AnimateIn variant="spring-up">
            <MatchCard match={final} featured />
          </AnimateIn>
        ) : null}
      </div>
    </div>
  );
}

export function TournamentPlayoffs({
  playoffs,
  brackets,
  description = "Top two from each pool advanced — here's how the finals unfolded.",
}: {
  playoffs: PlayoffMatch[];
  brackets?: PlayoffBracket[];
  description?: string;
}) {
  if (brackets && brackets.length > 0) {
    return (
      <section className="mx-auto max-w-4xl space-y-16 px-4 py-16 sm:space-y-20 sm:px-6 sm:py-20">
        {brackets.map((bracket) => (
          <BracketMatches
            key={bracket.key}
            matches={bracket.matches}
            title={bracket.name}
            blurb={bracket.blurb}
          />
        ))}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <BracketMatches
        matches={playoffs}
        title="Play-off results"
        blurb={description}
      />
    </section>
  );
}
