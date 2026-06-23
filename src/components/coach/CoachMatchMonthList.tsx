"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { CalendarDays, Clock, MapPin, RotateCcw, Trash2, XCircle } from "lucide-react";
import { MonthNavigator } from "@/components/calendar/MonthNavigator";
import { CoachSection } from "@/components/coach/CoachShell";
import { MatchFormFields } from "@/components/coach/MatchFormFields";
import {
  buildMatchPayload,
  formatMatchRowTitle,
  formatMatchVenueLabel,
  matchToFormState,
  type MatchFormState,
  type TeamMatchItem,
} from "@/components/coach/match-form-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiDelete, apiPut } from "@/lib/client-api";
import { groupItemsByMonthParam } from "@/lib/schedule-month-groups";
import {
  isAllMonthsParam,
  parseTrainingMonthParam,
} from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

function MatchEditForm({
  match,
  trainingTeamKey,
  matchesApiPath,
  onCancel,
  onSaved,
}: {
  match: TeamMatchItem;
  trainingTeamKey: string;
  matchesApiPath: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MatchFormState>(() => matchToFormState(match));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setLoading(true);
    setError(null);

    const result = await apiPut(
      `${matchesApiPath}/${match.id}`,
      buildMatchPayload(trainingTeamKey, form),
      "Could not save match",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved();
  };

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <MatchFormFields
        form={form}
        onChange={setForm}
        idPrefix={`edit-${match.id}`}
      />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save match"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}

function MatchRow({
  match,
  trainingTeamKey,
  matchesApiPath,
  editingId,
  actionId,
  onEdit,
  onCancel,
  onRestore,
  onDelete,
  onSaved,
  past = false,
}: {
  match: TeamMatchItem;
  trainingTeamKey: string;
  matchesApiPath: string;
  editingId: string | null;
  actionId: string | null;
  onEdit: (id: string | null) => void;
  onCancel: (match: TeamMatchItem) => void;
  onRestore: (match: TeamMatchItem) => void;
  onDelete: (match: TeamMatchItem) => void;
  onSaved: () => void;
  past?: boolean;
}) {
  const matchDate = new Date(match.matchStart);
  const isEditing = editingId === match.id;
  const isBusy = actionId === match.id;

  return (
    <div
      className={cn(
        "px-4 py-4",
        past && "opacity-70",
        match.cancelled && "bg-zinc-500/[0.04] opacity-70",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-medium",
                past || match.cancelled
                  ? "text-zinc-400 line-through decoration-zinc-600"
                  : "text-white",
              )}
            >
              {format(matchDate, "EEEE d")}
            </p>
            <Badge className="border-jackals-red/30 bg-jackals-red/10 text-jackals-red-light">
              {formatMatchRowTitle(match)}
            </Badge>
            {match.cancelled && (
              <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                Cancelled
              </Badge>
            )}
            {past && !match.cancelled && (
              <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                Past
              </Badge>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Warm-up {format(new Date(match.warmUpTime), "HH:mm")} · Kick-off{" "}
            {format(matchDate, "HH:mm")}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {formatMatchVenueLabel(match.venue)} · {match.location}
          </p>
        </div>

        {!past && (
          <div className="flex flex-wrap gap-2">
            {match.cancelled ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore(match)}
                  disabled={isBusy}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore match
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-red-400"
                  onClick={() => onDelete(match)}
                  disabled={isBusy}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={isEditing ? "ghost" : "outline"}
                  onClick={() => onEdit(isEditing ? null : match.id)}
                  disabled={isBusy}
                >
                  {isEditing ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-red-400"
                  onClick={() => onCancel(match)}
                  disabled={isBusy}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-red-400"
                  onClick={() => onDelete(match)}
                  disabled={isBusy}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isEditing && !match.cancelled && (
        <MatchEditForm
          match={match}
          trainingTeamKey={trainingTeamKey}
          matchesApiPath={matchesApiPath}
          onCancel={() => onEdit(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

export function CoachMatchMonthList({
  matches,
  monthParam,
  trainingTeamKey,
  matchesApiPath = "/api/coach/matches",
  buildPageUrl,
}: {
  matches: TeamMatchItem[];
  monthParam: string;
  trainingTeamKey: string;
  matchesApiPath?: string;
  buildPageUrl?: (monthParam: string) => string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAllMonths = isAllMonthsParam(monthParam);
  const month = parseTrainingMonthParam(isAllMonths ? undefined : monthParam);
  const pageUrl =
    buildPageUrl ?? ((param: string) => `/coach/matches?month=${param}`);

  const handleDelete = async (match: TeamMatchItem) => {
    if (
      !confirm(
        `Delete ${formatMatchRowTitle(match)} on ${format(new Date(match.matchStart), "EEEE d MMMM")}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setActionId(match.id);
    setError(null);

    const result = await apiDelete(
      `${matchesApiPath}/${match.id}`,
      "Could not delete match",
    );

    setActionId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEditingId(null);
    router.refresh();
  };

  const handleCancel = async (match: TeamMatchItem) => {
    if (
      !confirm(
        `Cancel ${formatMatchRowTitle(match)} on ${format(new Date(match.matchStart), "EEEE d MMMM")}? Players will see this match as cancelled.`,
      )
    ) {
      return;
    }

    setActionId(match.id);
    setError(null);

    const result = await apiDelete(
      `${matchesApiPath}/${match.id}?action=cancel`,
      "Could not cancel match",
    );

    setActionId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEditingId(null);
    router.refresh();
  };

  const handleRestore = async (match: TeamMatchItem) => {
    setActionId(match.id);
    setError(null);

    const result = await apiDelete(
      `${matchesApiPath}/${match.id}?action=restore`,
      "Could not restore match",
    );

    setActionId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEditingId(null);
    router.refresh();
  };

  const handleSaved = () => {
    setEditingId(null);
    router.refresh();
  };

  const matchRowProps = {
    trainingTeamKey,
    matchesApiPath,
    editingId,
    actionId,
    onEdit: setEditingId,
    onCancel: handleCancel,
    onRestore: handleRestore,
    onDelete: handleDelete,
    onSaved: handleSaved,
  };

  const renderMatchList = (listMatches: TeamMatchItem[]) => {
    if (listMatches.length === 0) {
      return (
        <Card className="py-10 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-3 text-sm font-medium text-zinc-300">
            {isAllMonths
              ? "No matches scheduled"
              : `No matches in ${format(month, "MMMM yyyy")}`}
          </p>
          {!isAllMonths && (
            <p className="mt-1 text-sm text-zinc-500">
              Try another month using the picker above, or choose All months.
            </p>
          )}
        </Card>
      );
    }

    if (isAllMonths) {
      const groups = groupItemsByMonthParam(
        listMatches,
        (match) => new Date(match.matchStart),
      );

      return (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-white/10">
            {groups.map(([groupMonthParam, groupSessions]) => (
              <div key={groupMonthParam}>
                <div className="bg-jackals-inset/50 px-4 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {format(parseTrainingMonthParam(groupMonthParam), "MMMM yyyy")}
                  </p>
                </div>
                {groupSessions.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    {...matchRowProps}
                    past={isPast(new Date(match.matchStart))}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      );
    }

    const upcoming = listMatches.filter(
      (match) => !isPast(new Date(match.matchStart)),
    );
    const past = listMatches.filter((match) =>
      isPast(new Date(match.matchStart)),
    );

    return (
      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-white/10">
          {upcoming.map((match) => (
            <MatchRow key={match.id} match={match} {...matchRowProps} />
          ))}

          {past.length > 0 && upcoming.length > 0 && (
            <div className="bg-jackals-inset/50 px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Earlier this month
              </p>
            </div>
          )}

          {past.map((match) => (
            <MatchRow key={match.id} match={match} {...matchRowProps} past />
          ))}
        </div>
      </Card>
    );
  };

  return (
    <CoachSection
      title="Match schedule"
      description="View and update fixtures by month. Edit a specific match without changing others."
    >
      <Card className="mb-4 p-4">
        <MonthNavigator
          monthParam={monthParam}
          showAllMonthsOption
          onMonthParamChange={(param) => {
            setEditingId(null);
            router.push(pageUrl(param));
          }}
          trailing={
            <p className="text-sm text-zinc-500">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </p>
          }
        />
      </Card>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {renderMatchList(matches)}
    </CoachSection>
  );
}
