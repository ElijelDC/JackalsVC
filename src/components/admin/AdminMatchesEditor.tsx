"use client";

import { useRouter } from "next/navigation";
import { AdminSection } from "@/components/admin/AdminShell";
import { CoachMatchesManager } from "@/components/coach/CoachMatchesManager";
import type { TeamMatchItem } from "@/components/coach/match-form-utils";
import { Label, Select } from "@/components/ui/Input";
import {
  type TrainingTeam,
} from "@/lib/training-teams-config";

export function AdminMatchesEditor({
  squads,
  selectedTeamKey,
  monthMatches,
  monthParam,
  sectionTitle,
  sectionDescription,
}: {
  squads: TrainingTeam[];
  selectedTeamKey: string;
  monthMatches: TeamMatchItem[];
  monthParam: string;
  sectionTitle: string;
  sectionDescription: string;
}) {
  const router = useRouter();
  const selectedTeam =
    squads.find((squad) => squad.key === selectedTeamKey) ?? squads[0] ?? null;

  const buildPageUrl = (param: string) => {
    const params = new URLSearchParams({
      team: selectedTeamKey,
      month: param,
    });
    return `/admin/matches?${params.toString()}`;
  };

  const handleTeamChange = (teamKey: string) => {
    const params = new URLSearchParams({ team: teamKey, month: monthParam });
    router.push(`/admin/matches?${params.toString()}`);
  };

  return (
    <AdminSection title={sectionTitle} description={sectionDescription}>
      <div className="mb-8 max-w-md">
        <Label htmlFor="admin-match-team">Training squad</Label>
        <Select
          id="admin-match-team"
          value={selectedTeamKey}
          onChange={(event) => handleTeamChange(event.target.value)}
        >
          {squads.map((squad) => (
            <option key={squad.key} value={squad.key}>
              {squad.name}
            </option>
          ))}
        </Select>
        <p className="mt-2 text-sm text-zinc-500">
          Choose which squad&apos;s match schedule to manage.
        </p>
      </div>

      {selectedTeam && selectedTeamKey ? (
        <CoachMatchesManager
          key={selectedTeamKey}
          teamName={selectedTeam.name}
          trainingTeamKey={selectedTeamKey}
          monthMatches={monthMatches}
          monthParam={monthParam}
          matchesApiPath="/api/admin/matches"
          buildPageUrl={buildPageUrl}
        />
      ) : (
        <p className="text-sm text-zinc-400">No training squads configured yet.</p>
      )}
    </AdminSection>
  );
}
