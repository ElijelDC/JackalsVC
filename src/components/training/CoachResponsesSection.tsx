import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import {
  TRAINING_ATTENDANCE_BADGE_STYLES,
  TRAINING_ATTENDANCE_LABELS,
  type TrainingRosterGroups,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

export function CoachResponsesSection({
  coaches,
}: {
  coaches: TrainingRosterGroups;
}) {
  const allCoaches = [
    ...coaches.attending,
    ...coaches.unanswered,
    ...coaches.notAttending,
  ];

  if (allCoaches.length === 0) return null;

  return (
    <div className="mt-5 border-t border-white/10 pt-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {allCoaches.length === 1 ? "Coach" : "Coaches"}
      </p>
      <ul className="space-y-2">
        {allCoaches.map((coach) => (
          <li key={coach.userId} className="flex items-center gap-3">
            <TeamMemberAvatar
              name={coach.name}
              className={cn(
                "h-8 w-8 shrink-0",
                coach.isCurrentUser &&
                  "ring-2 ring-jackals-red ring-offset-2 ring-offset-jackals-surface",
              )}
            />
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                coach.isCurrentUser
                  ? "font-medium text-jackals-red-light"
                  : "text-zinc-300",
              )}
              title={coach.isCurrentUser ? `${coach.name} (you)` : coach.name}
            >
              {coach.name}
            </span>
            {coach.status === "NOT_ATTENDING" && (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  TRAINING_ATTENDANCE_BADGE_STYLES.NOT_ATTENDING,
                )}
              >
                {TRAINING_ATTENDANCE_LABELS.NOT_ATTENDING}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
