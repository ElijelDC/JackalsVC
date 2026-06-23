"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { CoachSection } from "@/components/coach/CoachShell";
import { CoachMatchMonthList } from "@/components/coach/CoachMatchMonthList";
import { MatchFormFields } from "@/components/coach/MatchFormFields";
import {
  buildMatchPayload,
  createEmptyMatchForm,
  type TeamMatchItem,
} from "@/components/coach/match-form-utils";
import { apiPost } from "@/lib/client-api";

export function CoachMatchesManager({
  monthMatches,
  monthParam,
  trainingTeamKey,
  teamName,
  matchesApiPath = "/api/coach/matches",
  buildPageUrl,
}: {
  monthMatches: TeamMatchItem[];
  monthParam: string;
  trainingTeamKey: string;
  teamName: string;
  matchesApiPath?: string;
  buildPageUrl?: (monthParam: string) => string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(createEmptyMatchForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPost(
      matchesApiPath,
      buildMatchPayload(trainingTeamKey, form),
      "Could not add match",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Match added.");
    setForm(createEmptyMatchForm());
    router.refresh();
  };

  const defaultPageUrl = (param: string) => `/coach/matches?month=${param}`;

  return (
    <div className="space-y-10">
      <CoachSection
        title="Add match"
        description={`Schedule a new fixture for ${teamName}.`}
      >
        <AdminFormCard
          collapsible
          openTriggerLabel="Add match"
          title="Add match"
          error={error}
          message={message}
          onSubmit={handleSubmit}
          submitLabel="Add match"
          loading={loading}
        >
          <MatchFormFields form={form} onChange={setForm} idPrefix="add-match" />
        </AdminFormCard>
      </CoachSection>

      <CoachMatchMonthList
        matches={monthMatches}
        monthParam={monthParam}
        trainingTeamKey={trainingTeamKey}
        matchesApiPath={matchesApiPath}
        buildPageUrl={buildPageUrl ?? defaultPageUrl}
      />
    </div>
  );
}
