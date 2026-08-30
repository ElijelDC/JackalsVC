import type { CoachSquadRole } from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export function CoachSquadRoleBadge({
  role,
  className,
}: {
  role: CoachSquadRole;
  className?: string;
}) {
  const isHead = role === "head";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isHead
          ? "border-amber-400/45 bg-amber-500/15 text-amber-200"
          : "border-sky-400/35 bg-sky-500/10 text-sky-200",
        className,
      )}
    >
      {isHead ? "Head coach" : "Cover coach"}
    </span>
  );
}
