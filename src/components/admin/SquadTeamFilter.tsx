"use client";

import { Label, Select } from "@/components/ui/Input";
import type { TrainingTeam } from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export function SquadTeamFilter({
  value,
  onChange,
  squads,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  squads: TrainingTeam[];
  id: string;
  className?: string;
}) {
  if (squads.length === 0) return null;

  return (
    <div className={cn(className)}>
      <Label htmlFor={id}>Team</Label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All teams</option>
        {squads.map((squad) => (
          <option key={squad.key} value={squad.key}>
            {squad.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
