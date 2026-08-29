"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import {
  AdminFormCard,
  AdminInlineEditCard,
  beginAdminEdit,
} from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { TrialSessionSignupsPanel } from "@/components/admin/TrialSessionSignupsPanel";
import { DEFAULT_RECLUB_USERNAME } from "@/lib/club-payment-defaults";
import {
  formatInClubTime,
  toClubDatetimeLocal,
} from "@/lib/datetime-form";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import type {
  AdminTrialSessionListItem,
  TrialSessionReminderStats,
  TrialSessionSignupRecord,
} from "@/lib/trial-session-types";
import {
  isTrialSessionInPast,
  trialSessionPublicPath,
} from "@/lib/trial-session-types";
import { trialSessionReminderWindowOpensAt } from "@/lib/trial-session-reminder-window";
import { cn } from "@/lib/utils";

type SessionTimeFilter = "all" | "active" | "past" | "awaiting";

const TIME_FILTERS: { id: SessionTimeFilter; label: string }[] = [
  { id: "awaiting", label: "Awaiting approval" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

function isPastSession(session: AdminTrialSessionListItem, now = new Date()) {
  return isTrialSessionInPast(session, now);
}

function formatSessionWhen(iso: string) {
  return formatInClubTime(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

type TrialSessionFormState = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  locationUrl: string;
  coachName: string;
  paymentUrl: string;
  reclubUsername: string;
  sessionFee: string;
  slug: string;
  active: boolean;
};

function createEmptyForm(): TrialSessionFormState {
  return {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    locationUrl: "",
    coachName: "",
    paymentUrl: "",
    reclubUsername: DEFAULT_RECLUB_USERNAME,
    sessionFee: "",
    slug: "",
    active: true,
  };
}

function sessionFeeLabel(session: AdminTrialSessionListItem) {
  if (session.sessionFee == null) return "No fee set";
  if (Number.isInteger(session.sessionFee)) return `€${session.sessionFee}`;
  return `€${session.sessionFee.toFixed(2)}`;
}

function formFromSession(
  session: AdminTrialSessionListItem,
  options?: { duplicate?: boolean },
): TrialSessionFormState {
  const duplicate = options?.duplicate ?? false;
  const title = duplicate
    ? session.title.endsWith(" (copy)")
      ? session.title
      : `${session.title} (copy)`
    : session.title;

  return {
    title,
    description: session.description ?? "",
    startDate: toClubDatetimeLocal(session.startDate),
    endDate: toClubDatetimeLocal(session.endDate),
    location: session.location ?? "",
    locationUrl: session.locationUrl ?? "",
    coachName: session.coachName ?? "",
    paymentUrl: session.paymentUrl ?? "",
    reclubUsername: session.reclubUsername ?? DEFAULT_RECLUB_USERNAME,
    sessionFee: session.sessionFee?.toString() ?? "",
    slug: duplicate && !isPastSession(session) ? "" : session.slug,
    active: session.active,
  };
}

function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-jackals-red/40 hover:text-white"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy private link"}
    </button>
  );
}

function SessionFields({
  form,
  setForm,
  idPrefix,
  slugLocked,
  publicPathHint,
}: {
  form: TrialSessionFormState;
  setForm: (next: TrialSessionFormState) => void;
  idPrefix: string;
  slugLocked?: boolean;
  publicPathHint?: string | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows={4}
          placeholder="What to bring, level expected, payment instructions, etc."
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-start`}>Start (Ireland time)</Label>
        <Input
          id={`${idPrefix}-start`}
          type="datetime-local"
          value={form.startDate}
          onChange={(event) =>
            setForm({ ...form, startDate: event.target.value })
          }
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-end`}>End (optional, Ireland time)</Label>
        <Input
          id={`${idPrefix}-end`}
          type="datetime-local"
          value={form.endDate}
          onChange={(event) =>
            setForm({ ...form, endDate: event.target.value })
          }
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-location`}>Location</Label>
        <Input
          id={`${idPrefix}-location`}
          value={form.location}
          onChange={(event) =>
            setForm({ ...form, location: event.target.value })
          }
          placeholder="e.g. Meakstown Community Centre"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-location-url`}>Maps link</Label>
        <Input
          id={`${idPrefix}-location-url`}
          type="url"
          value={form.locationUrl}
          onChange={(event) =>
            setForm({ ...form, locationUrl: event.target.value })
          }
          placeholder="https://maps.google.com/..."
        />
        <p className="mt-1 text-xs text-zinc-500">
          Paste a Google Maps or Apple Maps link — shown as a clickable location
          on the public page.
        </p>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-coach`}>Session coach</Label>
        <Input
          id={`${idPrefix}-coach`}
          value={form.coachName}
          onChange={(event) =>
            setForm({ ...form, coachName: event.target.value })
          }
          placeholder="e.g. Orestis"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Shown on the public page instead of the registration count.
        </p>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-fee`}>Session fee (€)</Label>
        <Input
          id={`${idPrefix}-fee`}
          type="number"
          min="0"
          step="0.01"
          value={form.sessionFee}
          onChange={(event) =>
            setForm({ ...form, sessionFee: event.target.value })
          }
          placeholder="e.g. 10"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-payment-url`}>Payment link</Label>
        <Input
          id={`${idPrefix}-payment-url`}
          type="url"
          value={form.paymentUrl}
          onChange={(event) =>
            setForm({ ...form, paymentUrl: event.target.value })
          }
          placeholder="https://..."
        />
        <p className="mt-1 text-xs text-zinc-500">
          SumUp, Revolut, or other payment page — shown as step 1 on the public
          session page.
        </p>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-reclub-username`}>
          ReClub username (for payment reference)
        </Label>
        <Input
          id={`${idPrefix}-reclub-username`}
          value={form.reclubUsername}
          onChange={(event) =>
            setForm({ ...form, reclubUsername: event.target.value })
          }
          placeholder={DEFAULT_RECLUB_USERNAME}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-slug`}>Private link slug</Label>
        <Input
          id={`${idPrefix}-slug`}
          value={form.slug}
          onChange={(event) =>
            setForm({ ...form, slug: event.target.value })
          }
          placeholder="Auto-generated from title if left blank"
          disabled={slugLocked}
          readOnly={slugLocked}
        />
        <p className="mt-1 text-xs text-zinc-500">
          {slugLocked
            ? "This session is in the past, so the private link is closed and the slug can no longer be changed. Duplicate the session to reuse the slug."
            : `Link path: ${publicPathHint ?? trialSessionPublicPath(form.slug || "your-slug")}. Past sessions free this slug, so you can reuse it for the next one.`}
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={slugLocked ? false : form.active}
            onChange={(event) =>
              setForm({ ...form, active: event.target.checked })
            }
            disabled={slugLocked}
            className="rounded border-zinc-600"
          />
          {slugLocked
            ? "Registration closed — session is in the past"
            : "Registration open"}
        </label>
      </div>
    </div>
  );
}

export function TrialSessionsManager({
  initialSessions,
}: {
  initialSessions: AdminTrialSessionListItem[];
}) {
  const router = useRouter();
  const [sessions, setSessions] = useSyncedListState(initialSessions);
  const [createForm, setCreateForm] = useState(createEmptyForm);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [signups, setSignups] = useState<TrialSessionSignupRecord[]>([]);
  const [reminderStats, setReminderStats] =
    useState<TrialSessionReminderStats | null>(null);
  const [publicPath, setPublicPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSignupIds, setSelectedSignupIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<SessionTimeFilter>(() =>
    initialSessions.some((session) => session.pendingApprovalCount > 0)
      ? "awaiting"
      : "active",
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(createEmptyForm());
    setSignups([]);
    setReminderStats(null);
    setPublicPath(null);
    setSelectedSignupIds([]);
    setEditError(null);
    setSignupError(null);
  };

  const resetCreateForm = () => {
    setCreateForm(createEmptyForm());
    setIsDuplicating(false);
    setCreateError(null);
  };

  const loadSessions = useCallback(async () => {
    const result = await apiGet<{ sessions: AdminTrialSessionListItem[] }>(
      "/api/admin/trial-sessions",
    );
    if (result.ok) setSessions(result.data.sessions);
  }, [setSessions]);

  const loadSignups = useCallback(async (id: string) => {
    setLoadingSignups(true);
    setSignupError(null);
    const result = await apiGet<{
      signups: TrialSessionSignupRecord[];
      publicPath: string;
      reminderStats: TrialSessionReminderStats;
    }>(`/api/admin/trial-sessions/${id}`, "load registrations");

    setLoadingSignups(false);

    if (result.ok) {
      setSignups(result.data.signups);
      setPublicPath(result.data.publicPath);
      setReminderStats(result.data.reminderStats);
      setSelectedSignupIds((current) => {
        const eligible = new Set(
          result.data.signups
            .filter(
              (signup) =>
                signup.status === "APPROVED" && !signup.reminderSent,
            )
            .map((signup) => signup.id),
        );
        return current.filter((id) => eligible.has(id));
      });
      return;
    }

    setSignups([]);
    setReminderStats(null);
    setSelectedSignupIds([]);
    setSignupError(result.error);
  }, []);

  const startEdit = (session: AdminTrialSessionListItem) => {
    setEditingId(session.id);
    setEditForm(formFromSession(session));
    setPublicPath(trialSessionPublicPath(session.slug));
    setEditError(null);
    setListMessage(null);
    setCreateMessage(null);
    setSelectedSignupIds([]);
    setIsDuplicating(false);
  };

  const startDuplicate = (session: AdminTrialSessionListItem) => {
    beginAdminEdit(() => {
      cancelEdit();
      setIsDuplicating(true);
      setCreateForm(formFromSession(session, { duplicate: true }));
      setCreateError(null);
      setCreateMessage(null);
      setListMessage(null);
    });
  };

  const awaitingApprovalCount = useMemo(
    () =>
      sessions.reduce(
        (sum, session) => sum + (session.pendingApprovalCount || 0),
        0,
      ),
    [sessions],
  );

  const filteredSessions = useMemo(() => {
    const now = new Date();
    const filtered = sessions.filter((session) => {
      const past = isPastSession(session, now);
      if (timeFilter === "past") return past;
      if (timeFilter === "active") return !past;
      if (timeFilter === "awaiting") return session.pendingApprovalCount > 0;
      return true;
    });

    if (timeFilter === "awaiting") {
      return [...filtered].sort(
        (a, b) => b.pendingApprovalCount - a.pendingApprovalCount,
      );
    }

    return filtered;
  }, [sessions, timeFilter]);

  useEffect(() => {
    if (!editingId) return;
    void loadSignups(editingId);
  }, [editingId, loadSignups]);

  const editingSession = sessions.find((session) => session.id === editingId);
  const editingIsPast = editingSession
    ? isPastSession(editingSession)
    : false;

  const syncSignupCounts = (nextSignups: TrialSessionSignupRecord[]) => {
    if (!editingId) return;
    const signupCount = nextSignups.filter(
      (signup) => signup.status === "APPROVED",
    ).length;
    const pendingApprovalCount = nextSignups.filter(
      (signup) => signup.status === "PENDING",
    ).length;
    setSessions((current) =>
      current.map((session) =>
        session.id === editingId
          ? { ...session, signupCount, pendingApprovalCount }
          : session,
      ),
    );
  };

  const handleSignupsChange = (nextSignups: TrialSessionSignupRecord[]) => {
    setSignups(nextSignups);
    syncSignupCounts(nextSignups);
  };

  const payloadFrom = (
    form: TrialSessionFormState,
    options?: { lockSlug?: boolean },
  ) => ({
    title: form.title,
    description: form.description || undefined,
    startDate: form.startDate,
    endDate: form.endDate || undefined,
    location: form.location || undefined,
    locationUrl: form.locationUrl || undefined,
    coachName: form.coachName || undefined,
    paymentUrl: form.paymentUrl || undefined,
    reclubUsername: form.reclubUsername || undefined,
    sessionFee: form.sessionFee ? Number(form.sessionFee) : undefined,
    slug: options?.lockSlug ? undefined : form.slug || undefined,
    active: form.active,
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    setListMessage(null);

    const result = await apiPost(
      "/api/admin/trial-sessions",
      payloadFrom(createForm),
    );

    setLoading(false);

    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Session created.");
    resetCreateForm();
    cancelEdit();
    await loadSessions();
    router.refresh();
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(
      `/api/admin/trial-sessions/${editingId}`,
      payloadFrom(editForm, { lockSlug: editingIsPast }),
    );

    setLoading(false);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Session updated.");
    cancelEdit();
    await loadSessions();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session and all registrations?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/trial-sessions/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    if (editingId === id) cancelEdit();
    setListMessage("Session deleted.");
    await loadSessions();
    router.refresh();
  };

  const handleSendReminders = async () => {
    if (!editingId || !reminderStats) return;

    const idsToSend = signups
      .filter(
        (signup) =>
          selectedSignupIds.includes(signup.id) &&
          signup.status === "APPROVED" &&
          !signup.reminderSent,
      )
      .map((signup) => signup.id);

    if (idsToSend.length === 0) return;

    if (
      !confirm(
        `Send reminder emails to ${idsToSend.length} selected attendee${idsToSend.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }

    setSendingReminders(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPost<{
      attempted: number;
      delivered: number;
      failed: number;
      skipped: number;
    }>(
      `/api/admin/trial-sessions/${editingId}/send-reminder`,
      { signupIds: idsToSend },
      "send reminder emails",
    );

    setSendingReminders(false);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    const { delivered, failed } = result.data;
    setListMessage(
      failed > 0
        ? `Sent ${delivered} reminder${delivered === 1 ? "" : "s"}. ${failed} could not be delivered.`
        : `Sent ${delivered} reminder${delivered === 1 ? "" : "s"}.`,
    );
    setSelectedSignupIds([]);
    await loadSignups(editingId);
  };

  const reminderOpensAt = editingSession
    ? trialSessionReminderWindowOpensAt(editingSession.startDate)
    : null;

  const sessionSubtitle = (session: AdminTrialSessionListItem) =>
    [
      formatSessionWhen(session.startDate),
      session.endDate
        ? `to ${formatInClubTime(session.endDate, {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          })}`
        : null,
      isPastSession(session) ? "Past" : "Active",
      session.location ? session.location : null,
      session.coachName ? `Coach ${session.coachName}` : null,
      sessionFeeLabel(session),
      session.paymentUrl ? "Payment link set" : "No payment link",
      `${session.signupCount} approved`,
      isPastSession(session) || !session.active ? "Closed" : "Open",
    ]
      .filter(Boolean)
      .join(" · ");

  const sessionNote = (session: AdminTrialSessionListItem) =>
    session.pendingApprovalCount > 0
      ? `${session.pendingApprovalCount} awaiting approval`
      : undefined;

  return (
    <AdminSection
      title="One-off sessions"
      description="Create private one-off session links. Requests are submitted with email and payment receipt, then approved manually before they appear on the public list."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Create session"
        title={isDuplicating ? "Duplicate session" : "Create session"}
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        onCancel={isDuplicating ? resetCreateForm : undefined}
        submitLabel="Create session"
        loading={loading && !editingId}
      >
        <SessionFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="trial-session-create"
        />
      </AdminFormCard>

      <div className="mt-10 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1 rounded-lg bg-black/20 p-1">
            {TIME_FILTERS.map((option) => {
              const awaitingBadge =
                option.id === "awaiting" && awaitingApprovalCount > 0
                  ? awaitingApprovalCount
                  : null;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTimeFilter(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition sm:py-1.5",
                    timeFilter === option.id
                      ? option.id === "awaiting"
                        ? "bg-amber-500/20 text-amber-100 shadow-sm ring-1 ring-amber-500/40"
                        : "bg-jackals-red text-white shadow-sm"
                      : option.id === "awaiting" && awaitingBadge
                        ? "text-amber-200 hover:text-amber-100"
                        : "text-zinc-400 hover:text-white",
                  )}
                >
                  {option.label}
                  {awaitingBadge ? (
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                        timeFilter === "awaiting"
                          ? "bg-amber-400/30 text-amber-50"
                          : "bg-amber-500/25 text-amber-100",
                      )}
                    >
                      {awaitingBadge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-zinc-500">
            Showing {filteredSessions.length} of {sessions.length}
          </p>
        </div>

        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}

        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">No one-off sessions yet.</p>
        ) : filteredSessions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {timeFilter === "awaiting"
              ? "No sessions have people awaiting approval."
              : timeFilter === "past"
                ? "No past sessions."
                : timeFilter === "active"
                  ? "No active sessions."
                  : "No sessions match this filter."}
          </p>
        ) : (
          filteredSessions.map((session) => {
            const isEditing = editingId === session.id;
            const isPast = isPastSession(session);

            return (
              <AdminInlineEditCard
                key={session.id}
                isEditing={isEditing}
                title={session.title}
                subtitle={sessionSubtitle(session)}
                note={sessionNote(session)}
                formAction={
                  session.pendingApprovalCount > 0 && !isEditing
                    ? {
                        label: `Review ${session.pendingApprovalCount} awaiting`,
                        onClick: () => startEdit(session),
                      }
                    : undefined
                }
                onEdit={() => startEdit(session)}
                onDuplicate={() => startDuplicate(session)}
                onDelete={() => void handleDelete(session.id)}
                deleting={deletingId === session.id}
                onCancelEdit={cancelEdit}
                onSubmit={(e) => void handleUpdate(e)}
                loading={loading && isEditing}
                error={isEditing ? editError : null}
                afterForm={
                  isEditing ? (
                    <div className="border-t border-jackals-red/20 px-4 pb-4 pt-2">
                      <TrialSessionSignupsPanel
                        sessionId={session.id}
                        signups={signups}
                        reminderStats={reminderStats}
                        reminderOpensAt={reminderOpensAt}
                        loading={loadingSignups}
                        error={signupError}
                        selectedSignupIds={selectedSignupIds}
                        sendingReminders={sendingReminders}
                        onSignupsChange={handleSignupsChange}
                        onError={setSignupError}
                        onSelectSignupIds={setSelectedSignupIds}
                        onSendReminders={() => void handleSendReminders()}
                      />
                    </div>
                  ) : null
                }
              >
                <SessionFields
                  form={editForm}
                  setForm={setEditForm}
                  idPrefix={`trial-session-edit-${session.id}`}
                  slugLocked={isPast}
                  publicPathHint={publicPath}
                />

                {publicPath && !isPast ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
                    <CopyLinkButton path={publicPath} />
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-jackals-red-light hover:text-jackals-red"
                    >
                      Open public page
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : null}
              </AdminInlineEditCard>
            );
          })
        )}
      </div>
    </AdminSection>
  );
}
