"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { CoachSection } from "@/components/coach/CoachShell";
import {
  CoachTrainingOccurrences,
  type CoachUpcomingSession,
} from "@/components/coach/CoachTrainingOccurrences";
import { Input, Label, Select } from "@/components/ui/Input";
import { DAYS_OF_WEEK } from "@/lib/utils";
import { apiPatch } from "@/lib/client-api";

type TrainingSessionData = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  title: string;
};

function toFormState(session: TrainingSessionData) {
  return {
    dayOfWeek: String(session.dayOfWeek),
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
  };
}

export function CoachTrainingEditor({
  initialSession,
  monthSessions,
  monthParam,
  teamName,
  scheduleApiPath = "/api/coach/training",
  schedulePayload,
  occurrencesApiPath = "/api/coach/training/occurrences",
  buildPageUrl,
}: {
  initialSession: TrainingSessionData;
  monthSessions: CoachUpcomingSession[];
  monthParam: string;
  teamName: string;
  scheduleApiPath?: string;
  schedulePayload?: Record<string, unknown>;
  occurrencesApiPath?: string;
  buildPageUrl?: (monthParam: string) => string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => toFormState(initialSession));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(toFormState(initialSession));
  }, [initialSession]);

  const save = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPatch<{ session: TrainingSessionData }>(
      scheduleApiPath,
      {
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        ...schedulePayload,
      },
      "Could not save training schedule",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Weekly schedule updated.");
    router.refresh();
  };

  return (
    <div className="space-y-10">
      <CoachSection
        title="Weekly schedule"
        description={`Default training times for ${teamName}. These apply to all upcoming sessions unless you override a specific date below.`}
      >
        <AdminFormCard
          collapsible
          openTriggerLabel="Edit weekly schedule"
          title={initialSession.title}
          error={error}
          message={message}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          submitLabel="Save weekly schedule"
          loading={loading}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dayOfWeek">Day</Label>
              <Select
                id="dayOfWeek"
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start time</Label>
              <Input
                id="startTime"
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
              <Label htmlFor="endTime">End time</Label>
              <Input
                id="endTime"
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
          </div>
        </AdminFormCard>
      </CoachSection>

      <CoachTrainingOccurrences
        sessions={monthSessions}
        monthParam={monthParam}
        occurrencesApiPath={occurrencesApiPath}
        buildPageUrl={buildPageUrl}
      />
    </div>
  );
}
