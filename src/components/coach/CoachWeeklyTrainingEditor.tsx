"use client";

import { useRouter } from "next/navigation";
import { CoachTrainingEditor } from "@/components/coach/CoachTrainingEditor";
import type { CoachUpcomingSession } from "@/components/coach/CoachTrainingOccurrences";
import { CoachSection } from "@/components/coach/CoachShell";
import { Label, Select } from "@/components/ui/Input";
type CoachTeamOption = {
  key: string;
  name: string;
};

type SessionSummary = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  recurringFrom?: string | null;
  recurringTo?: string | null;
};

export function CoachWeeklyTrainingEditor({
  teams,
  selectedTeamKey,
  session,
  monthSessions,
  monthParam,
}: {
  teams: CoachTeamOption[];
  selectedTeamKey: string;
  session: SessionSummary | null;
  monthSessions: CoachUpcomingSession[];
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
    return `/coach/training?${params.toString()}`;
  };

  const handleTeamChange = (teamKey: string) => {
    const params = new URLSearchParams({ team: teamKey, month: monthParam });
    router.push(`/coach/training?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      {teams.length > 1 ? (
        <CoachSection
          title="Training squad"
          description="Choose which squad's weekly schedule and one-off changes to manage."
        >
          <div className="max-w-md">
            <Label htmlFor="coach-training-team">Training squad</Label>
            <Select
              id="coach-training-team"
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

      {!session || !selectedTeam ? (
        selectedTeam ? (
          <CoachTrainingEditor
            key={`create-${selectedTeamKey}`}
            teamName={selectedTeam.name}
            initialSession={{
              id: "",
              title: selectedTeam.name,
              dayOfWeek: 2,
              startTime: "19:00",
              endTime: "20:30",
              location: "",
            }}
            monthSessions={[]}
            monthParam={monthParam}
            schedulePayload={{ teamKey: selectedTeamKey }}
            buildPageUrl={buildPageUrl}
            isCreating
          />
        ) : (
          <p className="text-sm text-zinc-400">No training squads assigned yet.</p>
        )
      ) : (
        <CoachTrainingEditor
          key={session.id}
          teamName={selectedTeam.name}
          initialSession={session}
          monthSessions={monthSessions}
          monthParam={monthParam}
          schedulePayload={{ teamKey: selectedTeamKey }}
          buildPageUrl={buildPageUrl}
        />
      )}
    </div>
  );
}
