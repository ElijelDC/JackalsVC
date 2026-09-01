import type { CoachSquadRole } from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export function CoachSquadRoleBadge({
  role,
  className,
}: {
  role: CoachSquadRole;
  className?: string;
}) {
  const label = role === "head" ? "Head coach" : "Cover coach";

  return (
    <span
      className={cn(
        "font-normal normal-case tracking-normal text-zinc-500",
        className,
      )}
    >
      {label}
    </span>
  );
}
