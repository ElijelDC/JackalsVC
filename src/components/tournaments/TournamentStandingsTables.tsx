import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { cn } from "@/lib/utils";
import type { TournamentArchiveEntry } from "@/lib/tournament-archive";

type PoolRow = TournamentArchiveEntry["pools"][number]["rows"][number];
type PoolHighlight = TournamentArchiveEntry["poolHighlight"];

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function rowBadge(rank: number, highlight: PoolHighlight) {
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

function StatChip({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string | number;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 tabular-nums",
          emphasize ? "font-semibold text-white" : "text-zinc-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MobileStandingRow({
  row,
  highlight,
  showDraws,
  showH2h,
}: {
  row: PoolRow;
  highlight: PoolHighlight;
  showDraws: boolean;
  showH2h: boolean;
}) {
  const badge = rowBadge(row.rank, highlight);
  const hasH2h = showH2h && (row.h2hWins != null || row.h2hDiff != null);

  return (
    <li
      className={cn(
        "border-b border-white/5 px-4 py-3 last:border-0",
        badge?.className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="w-5 shrink-0 pt-0.5 font-display text-sm font-bold text-zinc-400">
          {row.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-display text-sm font-semibold uppercase tracking-wide break-words",
                badge?.tone === "cup" ? "text-white" : "text-zinc-300",
              )}
            >
              {row.team}
            </span>
            {badge ? (
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-widest",
                  badge.tone === "cup"
                    ? "text-jackals-red-light"
                    : "text-zinc-400",
                )}
              >
                {badge.label}
              </span>
            ) : null}
          </div>

          <div
            className={cn(
              "mt-2 grid gap-2 text-sm",
              showDraws ? "grid-cols-5" : "grid-cols-4",
            )}
          >
            <StatChip label="Pts" value={row.points} emphasize />
            <StatChip label="W" value={row.wins} />
            <StatChip label="L" value={row.losses} />
            {showDraws ? <StatChip label="D" value={row.draws ?? 0} /> : null}
            <StatChip label="Diff" value={formatDiff(row.scoreDiff)} />
          </div>

          {hasH2h ? (
            <p className="mt-2 text-xs tabular-nums text-zinc-500">
              H2H {row.h2hWins ?? "—"}
              {row.h2hDiff != null ? ` · Diff ${formatDiff(row.h2hDiff)}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function DesktopStandingTable({
  rows,
  highlight,
  showDraws,
  showH2h,
}: {
  rows: PoolRow[];
  highlight: PoolHighlight;
  showDraws: boolean;
  showH2h: boolean;
}) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <th className="px-3 py-3">#</th>
          <th className="px-3 py-3">Team</th>
          <th className="px-3 py-3 text-center">Pts</th>
          <th className="px-3 py-3 text-center">W</th>
          <th className="px-3 py-3 text-center">L</th>
          {showDraws ? (
            <th className="px-3 py-3 text-center">D</th>
          ) : null}
          <th className="px-3 py-3 text-center">Diff</th>
          {showH2h ? (
            <>
              <th className="px-3 py-3 text-center">H2H W</th>
              <th className="px-3 py-3 text-center">H2H Diff</th>
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
              <td className="px-3 py-3 font-display font-bold text-zinc-400">
                {row.rank}
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={cn(
                      "font-display font-semibold uppercase tracking-wide",
                      badge?.tone === "cup" ? "text-white" : "text-zinc-300",
                    )}
                  >
                    {row.team}
                  </span>
                  {badge ? (
                    <span
                      className={cn(
                        "text-[10px] font-semibold tracking-widest",
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
              <td className="px-3 py-3 text-center tabular-nums text-white">
                {row.points}
              </td>
              <td className="px-3 py-3 text-center tabular-nums text-zinc-300">
                {row.wins}
              </td>
              <td className="px-3 py-3 text-center tabular-nums text-zinc-300">
                {row.losses}
              </td>
              {showDraws ? (
                <td className="px-3 py-3 text-center tabular-nums text-zinc-300">
                  {row.draws ?? 0}
                </td>
              ) : null}
              <td className="px-3 py-3 text-center tabular-nums text-zinc-300">
                {formatDiff(row.scoreDiff)}
              </td>
              {showH2h ? (
                <>
                  <td className="px-3 py-3 text-center tabular-nums text-zinc-500">
                    {row.h2hWins ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-zinc-500">
                    {row.h2hDiff != null ? formatDiff(row.h2hDiff) : "—"}
                  </td>
                </>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
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
  highlight: PoolHighlight;
  showDraws: boolean;
  showH2h: boolean;
}) {
  return (
    <div className="flex h-full flex-col border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-3 sm:min-h-[4.5rem] sm:px-5">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
          {name}
        </h3>
        <p className="mt-1 text-xs leading-snug text-zinc-500">{advanceNote}</p>
      </div>

      {/* Mobile: stacked rows — no sideways scroll */}
      <ul className="md:hidden">
        {rows.map((row) => (
          <MobileStandingRow
            key={row.team}
            row={row}
            highlight={highlight}
            showDraws={showDraws}
            showH2h={showH2h}
          />
        ))}
      </ul>

      {/* Desktop: normal table */}
      <div className="hidden md:block">
        <DesktopStandingTable
          rows={rows}
          highlight={highlight}
          showDraws={showDraws}
          showH2h={showH2h}
        />
      </div>
    </div>
  );
}

export function TournamentStandingsTables({
  pools,
  advanceNote = "Top 2 advanced to the play-offs",
  highlight = "top-two",
  description = "Round-robin results from both courts — points, wins, and the tie-breakers that decided who advanced.",
  hideIntro = false,
}: {
  pools: TournamentArchiveEntry["pools"];
  advanceNote?: string;
  highlight?: TournamentArchiveEntry["poolHighlight"];
  description?: string;
  hideIntro?: boolean;
}) {
  const showDraws = pools.some((pool) =>
    pool.rows.some((row) => row.draws != null),
  );
  const showH2h = pools.some((pool) =>
    pool.rows.some((row) => row.h2hWins != null || row.h2hDiff != null),
  );

  const tables = (
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
  );

  if (hideIntro) return tables;

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

        {tables}
      </div>
    </section>
  );
}
