"use client";

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
    { key: "", label: "All teams" },
    ...squads.map((squad) => ({ key: squad.key, label: squad.name })),
  ];

  return (
    <nav
      aria-label="Filter by team"
      className={cn("w-full min-w-0 sm:w-auto", className)}
    >
      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-1 sm:gap-y-1">
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
                  "w-full rounded-sm px-0 py-1 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors sm:w-auto sm:px-1.5",
                  selected
                    ? "text-white"
                    : "text-zinc-500 hover:text-jackals-red-light",
                )}
              >
                {option.label}
              </button>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
