"use client";

import { CoachSquadRoleBadge } from "@/components/training/CoachSquadRoleBadge";
import type { TrainingTeam } from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export function SquadBannerTeamFilter({
  squads,
  value,
  onChange,
  className,
}: {
  squads: TrainingTeam[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  if (squads.length <= 1) return null;

  const options = [
    { key: "", label: "All teams", coachRole: undefined },
    ...squads.map((squad) => ({
      key: squad.key,
      label: squad.name,
      coachRole: squad.coachRole,
    })),
  ];

  return (
    <nav
      aria-label="Filter by team"
      className={cn("w-full min-w-0 sm:w-auto", className)}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-1 sm:gap-y-0">
        {options.map((option, index) => {
          const selected = value === option.key;
          return (
            <span
              key={option.key || "all"}
              className="inline-flex min-w-0 items-center"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className="mx-1.5 hidden h-3 w-px shrink-0 bg-jackals-red/25 sm:block"
                />
              )}
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option.key)}
                className={cn(
                  "inline-flex min-w-0 max-w-full flex-wrap items-baseline gap-x-1.5 rounded-sm px-0 py-1 text-left transition-colors sm:px-1.5",
                  selected
                    ? "text-white"
                    : "text-zinc-500 hover:text-jackals-red-light",
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {option.label}
                </span>
                {option.coachRole ? (
                  <>
                    <span aria-hidden className="text-zinc-600">
                      ·
                    </span>
                    <CoachSquadRoleBadge
                      role={option.coachRole}
                      className="text-[10px]"
                    />
                  </>
                ) : null}
              </button>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
