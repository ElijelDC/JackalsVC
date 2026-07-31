"use client";

import { useRouter } from "next/navigation";
import { CoachMatchesManager } from "@/components/coach/CoachMatchesManager";
import type { TeamMatchItem } from "@/components/coach/match-form-utils";
import { CoachSection } from "@/components/coach/CoachShell";
import { Label, Select } from "@/components/ui/Input";
type CoachTeamOption = {
  key: string;
  name: string;
};

export function CoachMatchesScheduleEditor({
  teams,
  selectedTeamKey,
  monthMatches,
  monthParam,
}: {
  teams: CoachTeamOption[];
  selectedTeamKey: string;
  monthMatches: TeamMatchItem[];
  monthParam: string;
}) {
  const router = useRouter();
  const selectedTeam =
    teams.find((team) => team.key === selectedTeamKey) ?? teams[0] ?? null;

  const buildPageUrl = (param: string) => {
    const params = new URLSearchParams({
      team: selectedTeamKey,
      month: param,
    });
    return `/coach/matches?${params.toString()}`;
  };

  const handleTeamChange = (teamKey: string) => {
    const params = new URLSearchParams({ team: teamKey, month: monthParam });
    router.push(`/coach/matches?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      {teams.length > 1 ? (
        <CoachSection
          title="Training squad"
          description="Choose which squad's match schedule to manage."
        >
          <div className="max-w-md">
            <Label htmlFor="coach-match-team">Training squad</Label>
            <Select
              id="coach-match-team"
              value={selectedTeamKey}
              onChange={(event) => handleTeamChange(event.target.value)}
            >
              {teams.map((team) => (
                <option key={team.key} value={team.key}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        </CoachSection>
      ) : null}

      {selectedTeam && selectedTeamKey ? (
        <CoachMatchesManager
          key={selectedTeamKey}
          teamName={selectedTeam.name}
          trainingTeamKey={selectedTeamKey}
          monthMatches={monthMatches}
          monthParam={monthParam}
          buildPageUrl={buildPageUrl}
        />
      ) : (
        <p className="text-sm text-zinc-400">No training squads assigned yet.</p>
      )}
    </div>
  );
}
