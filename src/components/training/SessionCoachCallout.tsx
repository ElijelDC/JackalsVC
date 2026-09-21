import { UserCheck } from "lucide-react";
import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import {
  getSessionCoachesForPlayers,
  sortCoachesForDisplay,
  type TrainingRosterGroups,
  type TrainingRosterMember,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function coachRoleLabel(coach: TrainingRosterMember) {
  if (coach.isHeadCoach) return "Head coach";
  if ((coach.coachPriority ?? 100) < 999) return "Cover coach";
  return "Coach";
}

export function SessionCoachCallout({
  coaches,
  className,
}: {
  coaches: TrainingRosterGroups;
  className?: string;
}) {
  const sessionCoaches = sortCoachesForDisplay(
    getSessionCoachesForPlayers(coaches),
  );

  if (sessionCoaches.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <UserCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            {sessionCoaches.length === 1 ? "Session coach" : "Session coaches"}
          </p>
          <ul className="mt-2 space-y-2">
            {sessionCoaches.map((coach) => (
              <li key={coach.userId} className="flex items-center gap-2.5">
                <TeamMemberAvatar
                  name={coach.name}
                  className="h-8 w-8 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {coach.name}
                  </p>
                  <p className="text-[11px] text-emerald-200/80">
                    {coachRoleLabel(coach)} · coaching this session
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
