import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { TournamentSetScores } from "@/components/tournaments/TournamentSetScores";
import { cn } from "@/lib/utils";
import type { PoolMatchResult } from "@/lib/tournament-archive";

function PoolMatchCard({
  match,
  scoreSlots,
}: {
  match: PoolMatchResult;
  scoreSlots: number;
}) {
  const isDraw = match.winner == null;
  const winnerIsA = match.winner === match.teamA;

  return (
    <article className="relative flex h-full min-h-[9.25rem] flex-col overflow-hidden border border-white/10 bg-white/[0.02]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent"
      />
      <div className="flex h-full flex-col px-4 py-4 sm:px-5">
        <div className="flex min-h-5 items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {match.time} · {match.court}
          </p>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-widest",
              isDraw ? "text-zinc-400" : "invisible",
            )}
          >
            Draw
          </span>
        </div>

        <div className="mt-3 flex flex-1 items-center gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div
              className={cn(
                "flex h-9 items-center gap-2 border-l-2 pl-3",
                !isDraw && winnerIsA
                  ? "border-jackals-red bg-jackals-red/10 pr-3"
                  : "border-transparent",
              )}
            >
              <span
                className={cn(
                  "truncate font-display text-sm font-bold uppercase tracking-wide sm:text-base",
                  !isDraw && winnerIsA ? "text-white" : "text-zinc-300",
                )}
              >
                {match.teamA}
              </span>
            </div>
            <div
              className={cn(
                "flex h-9 items-center gap-2 border-l-2 pl-3",
                !isDraw && !winnerIsA
                  ? "border-jackals-red bg-jackals-red/10 pr-3"
                  : "border-transparent",
              )}
            >
              <span
                className={cn(
                  "truncate font-display text-sm font-bold uppercase tracking-wide sm:text-base",
                  !isDraw && !winnerIsA ? "text-white" : "text-zinc-300",
                )}
              >
                {match.teamB}
              </span>
            </div>
          </div>

          <TournamentSetScores
            sets={match.sets}
            slotCount={scoreSlots}
            isDraw={isDraw}
            winnerIsA={winnerIsA}
          />
        </div>

        <p className="mt-3 min-h-4 text-[11px] text-zinc-500">
          {match.referee ? (
            <>
              Ref · <span className="text-zinc-400">{match.referee}</span>
            </>
          ) : (
            <span className="invisible">Ref</span>
          )}
        </p>
      </div>
    </article>
  );
}

export function TournamentPoolMatches({
  matches,
}: {
  matches: PoolMatchResult[];
}) {
  if (matches.length === 0) return null;

  const pools = [...new Set(matches.map((m) => m.pool))];
  const scoreSlots = Math.max(1, ...matches.map((m) => m.sets.length));

  return (
    <section className="border-t border-white/10 bg-jackals-surface/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Pool stage
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Match results
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Every pool fixture with set scores — Court 1 for Pool A, Court 2 for
            Pool B.
          </p>
        </AnimateIn>

        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-8">
          {pools.map((poolName) => {
            const poolMatches = matches.filter((m) => m.pool === poolName);
            return (
              <div key={poolName} className="flex h-full min-w-0 flex-col">
                <h3 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
                  {poolName}
                </h3>
                <StaggerIn className="flex flex-1 flex-col gap-3" stagger={50} variant="pop">
                  {poolMatches.map((match) => (
                    <PoolMatchCard
                      key={`${match.pool}-${match.time}-${match.teamA}`}
                      match={match}
                      scoreSlots={scoreSlots}
                    />
                  ))}
                </StaggerIn>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
