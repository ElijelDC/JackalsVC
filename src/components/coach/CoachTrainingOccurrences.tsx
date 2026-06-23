"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import {
  CalendarDays,
  Clock,
  MapPin,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { MonthNavigator } from "@/components/calendar/MonthNavigator";
import { CoachSection } from "@/components/coach/CoachShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { apiDelete, apiPatch } from "@/lib/client-api";
import { groupItemsByMonthParam } from "@/lib/schedule-month-groups";
import {
  isAllMonthsParam,
  parseTrainingMonthParam,
} from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export type CoachUpcomingSession = {
  eventId: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  customized: boolean;
  cancelled: boolean;
};

function formatTimeFromIso(iso: string) {
  return format(new Date(iso), "HH:mm");
}

function OccurrenceEditForm({
  session,
  onCancel,
  onSaved,
  occurrencesApiPath,
}: {
  session: CoachUpcomingSession;
  onCancel: () => void;
  onSaved: () => void;
  occurrencesApiPath: string;
}) {
  const [form, setForm] = useState({
    startTime: formatTimeFromIso(session.startDate),
    endTime: formatTimeFromIso(session.endDate ?? session.startDate),
    location: session.location ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setLoading(true);
    setError(null);

    const result = await apiPatch(
      `${occurrencesApiPath}/${session.eventId}`,
      form,
      "Could not save session changes",
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`start-${session.eventId}`}>Start time</Label>
          <Input
            id={`start-${session.eventId}`}
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
          <Label htmlFor={`end-${session.eventId}`}>End time</Label>
          <Input
            id={`end-${session.eventId}`}
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
        <div className="sm:col-span-2">
          <Label htmlFor={`location-${session.eventId}`}>Location</Label>
          <Input
            id={`location-${session.eventId}`}
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
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save this date"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  editingId,
  actionId,
  onEdit,
  onReset,
  onCancel,
  onSaved,
  occurrencesApiPath,
  past = false,
}: {
  session: CoachUpcomingSession;
  editingId: string | null;
  actionId: string | null;
  onEdit: (id: string | null) => void;
  onReset: (session: CoachUpcomingSession) => void;
  onCancel: (session: CoachUpcomingSession) => void;
  onSaved: () => void;
  occurrencesApiPath: string;
  past?: boolean;
}) {
  const date = new Date(session.startDate);
  const isEditing = editingId === session.eventId;
  const isBusy = actionId === session.eventId;
  const timeLabel = session.endDate
    ? `${formatTimeFromIso(session.startDate)} – ${formatTimeFromIso(session.endDate)}`
    : formatTimeFromIso(session.startDate);

  return (
    <div
      className={cn(
        "px-4 py-4",
        past && "opacity-70",
        session.cancelled && "bg-zinc-500/[0.04] opacity-70",
        session.customized && !past && !session.cancelled && "bg-blue-500/[0.03]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-medium",
                past || session.cancelled
                  ? "text-zinc-400 line-through decoration-zinc-600"
                  : "text-white",
              )}
            >
              {format(date, "EEEE d")}
            </p>
            {session.cancelled && (
              <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                Cancelled
              </Badge>
            )}
            {session.customized && !session.cancelled && (
              <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-300">
                Custom
              </Badge>
            )}
            {past && !session.cancelled && (
              <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                Past
              </Badge>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {timeLabel}
          </p>
          {session.location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {session.location}
            </p>
          )}
        </div>

        {!past && (
          <div className="flex flex-wrap gap-2">
            {session.cancelled ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onReset(session)}
                disabled={isBusy}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore session
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={isEditing ? "ghost" : "outline"}
                  onClick={() => onEdit(isEditing ? null : session.eventId)}
                  disabled={isBusy}
                >
                  {isEditing ? "Close" : "Edit"}
                </Button>
                {session.customized && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onReset(session)}
                    disabled={isBusy}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-red-400"
                  onClick={() => onCancel(session)}
                  disabled={isBusy}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isEditing && !session.cancelled && (
        <OccurrenceEditForm
          session={session}
          onCancel={() => onEdit(null)}
          onSaved={onSaved}
          occurrencesApiPath={occurrencesApiPath}
        />
      )}
    </div>
  );
}

export function CoachTrainingOccurrences({
  sessions,
  monthParam,
  occurrencesApiPath = "/api/coach/training/occurrences",
  buildPageUrl,
}: {
  sessions: CoachUpcomingSession[];
  monthParam: string;
  occurrencesApiPath?: string;
  buildPageUrl?: (monthParam: string) => string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAllMonths = isAllMonthsParam(monthParam);
  const month = parseTrainingMonthParam(isAllMonths ? undefined : monthParam);
  const pageUrl =
    buildPageUrl ??
    ((param: string) => `/coach/training?month=${param}`);

  const customizedCount = sessions.filter((session) => session.customized).length;

  const handleReset = async (session: CoachUpcomingSession) => {
    if (
      !confirm(
        `Reset ${format(new Date(session.startDate), "EEEE d MMMM")} to the weekly schedule?`,
      )
    ) {
      return;
    }

    setActionId(session.eventId);
    setError(null);

    const result = await apiDelete(
      `${occurrencesApiPath}/${session.eventId}?action=reset`,
      "Could not reset session",
    );

    setActionId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEditingId(null);
    router.refresh();
  };

  const handleCancel = async (session: CoachUpcomingSession) => {
    if (
      !confirm(
        `Cancel training on ${format(new Date(session.startDate), "EEEE d MMMM")}? Players will not see this session.`,
      )
    ) {
      return;
    }

    setActionId(session.eventId);
    setError(null);

    const result = await apiDelete(
      `${occurrencesApiPath}/${session.eventId}?action=cancel`,
      "Could not cancel session",
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

  const sessionListProps = {
    editingId,
    actionId,
    onEdit: setEditingId,
    onReset: handleReset,
    onCancel: handleCancel,
    onSaved: handleSaved,
    occurrencesApiPath,
  };

  const renderSessionList = (listSessions: CoachUpcomingSession[]) => {
    if (listSessions.length === 0) {
      return (
        <Card className="py-10 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-3 text-sm font-medium text-zinc-300">
            {isAllMonths
              ? "No training sessions scheduled"
              : `No sessions in ${format(month, "MMMM yyyy")}`}
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
        listSessions,
        (session) => new Date(session.startDate),
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
                {groupSessions.map((session) => (
                  <SessionRow
                    key={session.eventId}
                    session={session}
                    {...sessionListProps}
                    past={isPast(new Date(session.startDate))}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      );
    }

    const upcoming = listSessions.filter(
      (session) => !isPast(new Date(session.startDate)),
    );
    const past = listSessions.filter((session) =>
      isPast(new Date(session.startDate)),
    );

    return (
      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-white/10">
          {upcoming.map((session) => (
            <SessionRow
              key={session.eventId}
              session={session}
              {...sessionListProps}
            />
          ))}

          {past.length > 0 && upcoming.length > 0 && (
            <div className="bg-jackals-inset/50 px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Earlier this month
              </p>
            </div>
          )}

          {past.map((session) => (
            <SessionRow
              key={session.eventId}
              session={session}
              {...sessionListProps}
              past
            />
          ))}
        </div>
      </Card>
    );
  };

  return (
    <CoachSection
      title="One-off session changes"
      description="Change the time or location for a specific date without affecting the weekly schedule."
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
              {sessions.length} session{sessions.length === 1 ? "" : "s"}
              {customizedCount > 0 && (
                <>
                  {" · "}
                  <span className="text-blue-300">{customizedCount} custom</span>
                </>
              )}
            </p>
          }
        />
      </Card>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {renderSessionList(sessions)}
    </CoachSection>
  );
}
