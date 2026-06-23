import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import { cn } from "@/lib/utils";
import type { TrainingRosterMember } from "@/lib/training-attendance-config";

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

export function SquadRosterGroup({
  title,
  members,
  tone,
  headerAction,
}: {
  title: string;
  members: TrainingRosterMember[];
  tone: "green" | "rose" | "amber";
  headerAction?: React.ReactNode;
}) {
  const toneStyles = {
    green: {
      label: "text-green-400",
      ring: "ring-green-500/35",
    },
    rose: {
      label: "text-rose-300",
      ring: "ring-rose-400/35",
    },
    amber: {
      label: "text-amber-300",
      ring: "ring-amber-500/35",
    },
  };

  const styles = toneStyles[tone];

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            styles.label,
          )}
        >
          {title} ({members.length})
        </p>
        {headerAction}
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-zinc-600">No one yet</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-2 gap-y-4">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex min-w-0 flex-col items-center gap-1.5 text-center"
            >
              <TeamMemberAvatar
                name={member.name}
                className={cn(
                  "h-10 w-10 ring-2",
                  member.isCurrentUser
                    ? "ring-jackals-red ring-offset-2 ring-offset-jackals-surface"
                    : styles.ring,
                )}
              />
              <span
                className={cn(
                  "w-full truncate text-[11px] font-medium leading-tight",
                  member.isCurrentUser ? "text-jackals-red-light" : "text-zinc-400",
                )}
                title={
                  member.isCurrentUser ? `${member.name} (you)` : member.name
                }
              >
                {firstName(member.name)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
