import { cn } from "@/lib/utils";

/** Shared set-score chips for pool and play-off match cards. */
export function TournamentSetScores({
  sets,
  slotCount,
  align = "end",
  winnerIsA,
  isDraw = false,
}: {
  sets: [number, number][];
  /** Pad to this many slots so cards in a column line up. */
  slotCount?: number;
  align?: "end" | "center";
  /** When set (and not a draw), emphasize the winning side’s set scores. */
  winnerIsA?: boolean;
  isDraw?: boolean;
}) {
  const count = Math.max(slotCount ?? sets.length, sets.length, 1);
  const slots: ([number, number] | null)[] = Array.from(
    { length: count },
    (_, i) => sets[i] ?? null,
  );

  return (
    <div
      className={cn(
        "grid shrink-0 gap-1.5",
        count === 1 && "w-[3.5rem] grid-cols-1",
        count === 2 && "w-[7rem] grid-cols-2",
        count >= 3 && "w-[10.5rem] grid-cols-3",
        align === "center" && "justify-items-center",
      )}
    >
      {slots.map((set, i) => {
        if (!set) {
          return (
            <span
              key={i}
              className="inline-flex h-8 items-center justify-center border border-transparent px-1 font-display text-sm tabular-nums text-transparent"
              aria-hidden
            >
              00–00
            </span>
          );
        }
        const [a, b] = set;
        const aWon = a > b;
        const bWon = b > a;
        const emphasizeA =
          isDraw || winnerIsA == null ? aWon : aWon && winnerIsA;
        const emphasizeB =
          isDraw || winnerIsA == null ? bWon : bWon && !winnerIsA;

        return (
          <span
            key={i}
            className="inline-flex h-8 w-full items-center justify-center gap-0.5 border border-white/10 bg-black/30 px-1 font-display text-sm tabular-nums"
          >
            <span
              className={cn(
                "inline-block w-[1.25rem] text-right",
                emphasizeA ? "font-bold text-white" : "text-zinc-500",
              )}
            >
              {a}
            </span>
            <span className="text-zinc-600">–</span>
            <span
              className={cn(
                "inline-block w-[1.25rem] text-left",
                emphasizeB ? "font-bold text-white" : "text-zinc-500",
              )}
            >
              {b}
            </span>
          </span>
        );
      })}
    </div>
  );
}
