import { X } from "lucide-react";
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
  onRemoveGuest,
  removingGuestId,
}: {
  title: string;
  members: TrainingRosterMember[];
  tone: "green" | "rose" | "amber";
  headerAction?: React.ReactNode;
  /** When set, guests show an X to remove them from the session. */
  onRemoveGuest?: (guestSignupId: string) => void;
  removingGuestId?: string | null;
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
          {members.map((member) => {
            const guestSignupId = member.isGuest
              ? member.userId.replace(/^guest:/, "")
              : null;
            const canRemove =
              Boolean(onRemoveGuest) &&
              Boolean(guestSignupId) &&
              Boolean(member.isGuest);

            return (
              <li
                key={member.userId}
                className="relative flex min-w-0 flex-col items-center gap-1.5 text-center"
              >
                {canRemove ? (
                  <button
                    type="button"
                    aria-label={`Remove guest ${member.name}`}
                    disabled={removingGuestId === guestSignupId}
                    onClick={() => onRemoveGuest?.(guestSignupId!)}
                    className="absolute -right-0.5 -top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-jackals-inset text-zinc-300 transition hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
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
                    member.isCurrentUser
                      ? "text-jackals-red-light"
                      : "text-zinc-400",
                  )}
                  title={
                    member.isGuest
                      ? `${member.name} (guest)`
                      : member.isCurrentUser
                        ? `${member.name} (you)`
                        : member.name
                  }
                >
                  {firstName(member.name)}
                </span>
                {member.isGuest ? (
                  <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                    Guest
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
