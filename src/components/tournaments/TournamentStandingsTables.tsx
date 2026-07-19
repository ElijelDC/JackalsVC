import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { cn } from "@/lib/utils";
import type { TournamentArchiveEntry } from "@/lib/tournament-archive";

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function rowBadge(
  rank: number,
  highlight: TournamentArchiveEntry["poolHighlight"],
) {
  if (highlight === "cup-and-shield") {
    if (rank <= 2) {
      return {
        label: "Cup",
        className: "bg-jackals-red/[0.08]",
        tone: "cup" as const,
      };
    }
    return {
      label: "Shield",
      className: "bg-zinc-400/[0.08]",
      tone: "shield" as const,
    };
  }
  if (rank <= 2) {
    return {
      label: "Q",
      className: "bg-jackals-red/[0.08]",
      tone: "cup" as const,
    };
  }
  return null;
}

function PoolTable({
  name,
  rows,
  advanceNote,
  highlight,
  showDraws,
  showH2h,
}: {
  name: string;
  rows: TournamentArchiveEntry["pools"][number]["rows"];
  advanceNote: string;
  highlight: TournamentArchiveEntry["poolHighlight"];
  showDraws: boolean;
  showH2h: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-3 sm:min-h-[4.5rem] sm:px-5">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
          {name}
        </h3>
        <p className="mt-1 text-xs leading-snug text-zinc-500">{advanceNote}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="w-10" />
            <col />
            <col className="w-12" />
            <col className="w-10" />
            <col className="w-10" />
            {showDraws ? <col className="w-10" /> : null}
            <col className="w-14" />
            {showH2h ? (
              <>
                <col className="w-14" />
                <col className="w-16" />
              </>
            ) : null}
          </colgroup>
          <thead>
            <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-2 py-3 sm:px-3">#</th>
              <th className="px-2 py-3 sm:px-3">Team</th>
              <th className="px-2 py-3 text-center sm:px-3">Pts</th>
              <th className="px-2 py-3 text-center sm:px-3">W</th>
              <th className="px-2 py-3 text-center sm:px-3">L</th>
              {showDraws ? (
                <th className="px-2 py-3 text-center sm:px-3">D</th>
              ) : null}
              <th className="px-2 py-3 text-center sm:px-3">Diff</th>
              {showH2h ? (
                <>
                  <th className="px-2 py-3 text-center sm:px-3">H2H W</th>
                  <th className="px-2 py-3 text-center sm:px-3">H2H Diff</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const badge = rowBadge(row.rank, highlight);
              return (
                <tr
                  key={row.team}
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    badge?.className,
                  )}
                >
                  <td className="px-2 py-3 font-display font-bold text-zinc-400 sm:px-3">
                    {row.rank}
                  </td>
                  <td className="px-2 py-3 sm:px-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "truncate font-display font-semibold uppercase tracking-wide",
                          badge?.tone === "cup" ? "text-white" : "text-zinc-300",
                        )}
                      >
                        {row.team}
                      </span>
                      {badge ? (
                        <span
                          className={cn(
                            "inline-flex h-5 w-[3.25rem] shrink-0 items-center justify-center text-[10px] font-semibold tracking-widest",
                            badge.tone === "cup"
                              ? "text-jackals-red-light"
                              : "text-zinc-400",
                          )}
                        >
                          {badge.label}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums text-white sm:px-3">
                    {row.points}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums text-zinc-300 sm:px-3">
                    {row.wins}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums text-zinc-300 sm:px-3">
                    {row.losses}
                  </td>
                  {showDraws ? (
                    <td className="px-2 py-3 text-center tabular-nums text-zinc-300 sm:px-3">
                      {row.draws ?? 0}
                    </td>
                  ) : null}
                  <td className="px-2 py-3 text-center tabular-nums text-zinc-300 sm:px-3">
                    {formatDiff(row.scoreDiff)}
                  </td>
                  {showH2h ? (
                    <>
                      <td className="px-2 py-3 text-center tabular-nums text-zinc-500 sm:px-3">
                        {row.h2hWins ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-zinc-500 sm:px-3">
                        {row.h2hDiff != null ? formatDiff(row.h2hDiff) : "—"}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TournamentStandingsTables({
  pools,
  advanceNote = "Top 2 advanced to the play-offs",
  highlight = "top-two",
  description = "Round-robin results from both courts — points, wins, and the tie-breakers that decided who advanced.",
}: {
  pools: TournamentArchiveEntry["pools"];
  advanceNote?: string;
  highlight?: TournamentArchiveEntry["poolHighlight"];
  description?: string;
}) {
  const showDraws = pools.some((pool) =>
    pool.rows.some((row) => row.draws != null),
  );
  const showH2h = pools.some((pool) =>
    pool.rows.some((row) => row.h2hWins != null || row.h2hDiff != null),
  );

  return (
    <section className="border-t border-white/10 bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Pool stage
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Overall standings
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {description}
          </p>
        </AnimateIn>

        <StaggerIn
          className="grid items-stretch gap-6 lg:grid-cols-2"
          stagger={100}
          variant="pop"
        >
          {pools.map((pool) => (
            <PoolTable
              key={pool.name}
              name={pool.name}
              rows={pool.rows}
              advanceNote={advanceNote}
              highlight={highlight}
              showDraws={showDraws}
              showH2h={showH2h}
            />
          ))}
        </StaggerIn>
      </div>
    </section>
  );
}
