"use client";

import { cn } from "@/lib/utils";

export type CoachTeamOption = {
  key: string;
  name: string;
};

export function CoachTeamFilter({
  teams,
  value,
  onChange,
  className,
}: {
  teams: CoachTeamOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  if (teams.length <= 1) return null;

  const options = [
    { key: "", label: "All" },
    ...teams.map((team) => ({ key: team.key, label: team.name })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by squad"
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key || "all"}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.key)}
            className={cn(
              "max-w-[10rem] shrink-0 truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              selected
                ? "border-jackals-red/40 bg-jackals-red/15 text-white"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function filterCoachItemsByTeam<T extends { teamKey?: string | null }>(
  items: T[],
  teamKey: string,
) {
  if (!teamKey) return items;
  return items.filter((item) => item.teamKey === teamKey);
}
