"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { CoachTrainingEditor } from "@/components/coach/CoachTrainingEditor";
import type { CoachUpcomingSession } from "@/components/coach/CoachTrainingOccurrences";
import { Label, Select, Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { apiPost } from "@/lib/client-api";
import {
  defaultRecurringFrom,
  defaultRecurringTo,
} from "@/lib/training-utils";
import {
  type TrainingTeam,
} from "@/lib/training-teams-config";
import { DAYS_OF_WEEK } from "@/lib/utils";

type SessionSummary = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
};

function AdminWeeklyTrainingSetup({
  team,
  onCreated,
}: {
  team: TrainingTeam;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    dayOfWeek: String(team.dayOfWeek),
    startTime: "19:00",
    endTime: "21:00",
    location: "",
    recurringFrom: defaultRecurringFrom(),
    recurringTo: defaultRecurringTo(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      dayOfWeek: String(team.dayOfWeek),
    }));
  }, [team.key, team.dayOfWeek]);

  const createSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await apiPost(
      "/api/admin/training",
      {
        title: `${team.name} Training`,
        trainingTeamKey: team.key,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        level: team.name,
        recurring: true,
        recurrenceWeeks: 1,
        recurringFrom: form.recurringFrom,
        recurringTo: form.recurringTo,
      },
      "Could not create training session",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onCreated();
  };

  return (
    <AdminFormCard
      title={`Set up ${team.name}`}
      error={error}
      message={null}
      onSubmit={createSession}
      submitLabel="Create weekly session"
      loading={loading}
    >
      <p className="mb-4 text-sm text-zinc-500">
        This squad does not have a weekly training session yet.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="setup-dayOfWeek">Day</Label>
          <Select
            id="setup-dayOfWeek"
            value={form.dayOfWeek}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dayOfWeek: event.target.value,
              }))
            }
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <option key={day} value={String(index)}>
                {day}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="setup-location">Location</Label>
          <Input
            id="setup-location"
            value={form.location}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                location: event.target.value,
              }))
            }
            placeholder="Sports Hall A"
            required
          />
        </div>
        <div>
          <Label htmlFor="setup-startTime">Start time</Label>
          <Input
            id="setup-startTime"
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startTime: event.target.value,
              }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="setup-endTime">End time</Label>
          <Input
            id="setup-endTime"
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                endTime: event.target.value,
              }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="setup-recurringFrom">Start date</Label>
          <DatePicker
            id="setup-recurringFrom"
            value={form.recurringFrom}
            onChange={(date) =>
              setForm((current) => ({
                ...current,
                recurringFrom: date,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="setup-recurringTo">End date</Label>
          <DatePicker
            id="setup-recurringTo"
            value={form.recurringTo}
            onChange={(date) =>
              setForm((current) => ({
                ...current,
                recurringTo: date,
              }))
            }
          />
        </div>
      </div>
    </AdminFormCard>
  );
}

export function AdminWeeklyTrainingEditor({
  squads,
  selectedTeamKey,
  session,
  monthSessions,
  monthParam,
  sectionTitle,
  sectionDescription,
}: {
  squads: TrainingTeam[];
  selectedTeamKey: string;
  session: SessionSummary | null;
  monthSessions: CoachUpcomingSession[];
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
    return `/admin/training?${params.toString()}`;
  };

  const handleTeamChange = (teamKey: string) => {
    const params = new URLSearchParams({ team: teamKey, month: monthParam });
    router.push(`/admin/training?${params.toString()}`);
  };

  return (
    <AdminSection title={sectionTitle} description={sectionDescription}>
      <div className="mb-8 max-w-md">
        <Label htmlFor="admin-training-team">Training squad</Label>
        <Select
          id="admin-training-team"
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
          Choose which squad&apos;s weekly schedule and one-off changes to manage.
        </p>
      </div>

      {!session || !selectedTeam ? (
        selectedTeam ? (
          <AdminWeeklyTrainingSetup
            team={selectedTeam}
            onCreated={() => router.refresh()}
          />
        ) : (
          <p className="text-sm text-zinc-400">No training squads configured yet.</p>
        )
      ) : (
        <CoachTrainingEditor
          key={session.id}
          teamName={selectedTeam.name}
          initialSession={session}
          monthSessions={monthSessions}
          monthParam={monthParam}
          scheduleApiPath="/api/admin/training/schedule"
          schedulePayload={{ teamKey: selectedTeamKey }}
          occurrencesApiPath="/api/admin/training/occurrences"
          buildPageUrl={buildPageUrl}
        />
      )}
    </AdminSection>
  );
}
