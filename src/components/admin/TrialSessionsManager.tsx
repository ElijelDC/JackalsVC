"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import {
  AdminFormCard,
  AdminListItem,
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

type SessionTimeFilter = "all" | "active" | "past";

const TIME_FILTERS: { id: SessionTimeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
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

export function TrialSessionsManager({
  initialSessions,
}: {
  initialSessions: AdminTrialSessionListItem[];
}) {
  const router = useRouter();
  const [sessions, setSessions] = useSyncedListState(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [form, setForm] = useState<TrialSessionFormState>(createEmptyForm);
  const [signups, setSignups] = useState<TrialSessionSignupRecord[]>([]);
  const [reminderStats, setReminderStats] =
    useState<TrialSessionReminderStats | null>(null);
  const [publicPath, setPublicPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSignupIds, setSelectedSignupIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<SessionTimeFilter>("active");
  const [error, setError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setIsDuplicating(false);
    setSignups([]);
    setReminderStats(null);
    setPublicPath(null);
    setSelectedSignupIds([]);
    setError(null);
    setSignupError(null);
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

  const formFromSession = (
    session: AdminTrialSessionListItem,
    options?: { duplicate?: boolean },
  ): TrialSessionFormState => {
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
      slug:
        duplicate && !isPastSession(session)
          ? ""
          : session.slug,
      active: session.active,
    };
  };

  const startEdit = (session: AdminTrialSessionListItem) => {
    beginAdminEdit(() => {
      setEditingId(session.id);
      setIsDuplicating(false);
      setForm(formFromSession(session));
      setPublicPath(trialSessionPublicPath(session.slug));
      setError(null);
      setMessage(null);
      setSelectedSignupIds([]);
    });
  };

  const startDuplicate = (session: AdminTrialSessionListItem) => {
    beginAdminEdit(() => {
      setEditingId(null);
      setIsDuplicating(true);
      setForm(formFromSession(session, { duplicate: true }));
      setSignups([]);
      setReminderStats(null);
      setPublicPath(null);
      setError(null);
      setMessage(null);
      setSelectedSignupIds([]);
      setSignupError(null);
    });
  };

  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter((session) => {
      const past = isPastSession(session, now);
      if (timeFilter === "past") return past;
      if (timeFilter === "active") return !past;
      return true;
    });
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
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
      slug: editingIsPast ? undefined : form.slug || undefined,
      active: form.active,
    };

    const result = editingId
      ? await apiPut(`/api/admin/trial-sessions/${editingId}`, payload)
      : await apiPost("/api/admin/trial-sessions", payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Session updated." : "Session created.");
    if (!editingId) {
      resetForm();
    }
    await loadSessions();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session and all registrations?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/trial-sessions/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
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
    setError(null);
    setMessage(null);

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
      setError(result.error);
      return;
    }

    const { delivered, failed } = result.data;
    setMessage(
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

  return (
    <AdminSection
      title="One-off sessions"
      description="Create private one-off session links. Requests are submitted with email and payment receipt, then approved manually before they appear on the public list."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Create session"
        title={
          editingId
            ? "Edit session"
            : isDuplicating
              ? "Duplicate session"
              : "Create session"
        }
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId || isDuplicating ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Create session"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-title">Title</Label>
            <Input
              id="trial-session-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-description">Description</Label>
            <Textarea
              id="trial-session-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              placeholder="What to bring, level expected, payment instructions, etc."
            />
          </div>
          <div>
            <Label htmlFor="trial-session-start">Start (Ireland time)</Label>
            <Input
              id="trial-session-start"
              type="datetime-local"
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="trial-session-end">End (optional, Ireland time)</Label>
            <Input
              id="trial-session-end"
              type="datetime-local"
              value={form.endDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-location">Location</Label>
            <Input
              id="trial-session-location"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="e.g. Meakstown Community Centre"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-location-url">Maps link</Label>
            <Input
              id="trial-session-location-url"
              type="url"
              value={form.locationUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  locationUrl: event.target.value,
                }))
              }
              placeholder="https://maps.google.com/..."
            />
            <p className="mt-1 text-xs text-zinc-500">
              Paste a Google Maps or Apple Maps link — shown as a clickable
              location on the public page.
            </p>
          </div>
          <div>
            <Label htmlFor="trial-session-coach">Session coach</Label>
            <Input
              id="trial-session-coach"
              value={form.coachName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  coachName: event.target.value,
                }))
              }
              placeholder="e.g. Orestis"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Shown on the public page instead of the registration count.
            </p>
          </div>
          <div>
            <Label htmlFor="trial-session-fee">Session fee (€)</Label>
            <Input
              id="trial-session-fee"
              type="number"
              min="0"
              step="0.01"
              value={form.sessionFee}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sessionFee: event.target.value,
                }))
              }
              placeholder="e.g. 10"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-payment-url">Payment link</Label>
            <Input
              id="trial-session-payment-url"
              type="url"
              value={form.paymentUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  paymentUrl: event.target.value,
                }))
              }
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-zinc-500">
              SumUp, Revolut, or other payment page — shown as step 1 on the public
              session page.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-reclub-username">ReClub username (for payment reference)</Label>
            <Input
              id="trial-session-reclub-username"
              value={form.reclubUsername}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reclubUsername: event.target.value,
                }))
              }
              placeholder={DEFAULT_RECLUB_USERNAME}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trial-session-slug">Private link slug</Label>
            <Input
              id="trial-session-slug"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              placeholder="Auto-generated from title if left blank"
              disabled={editingIsPast}
              readOnly={editingIsPast}
            />
            <p className="mt-1 text-xs text-zinc-500">
              {editingIsPast
                ? "This session is in the past, so the private link is closed and the slug can no longer be changed. Duplicate the session to reuse the slug."
                : `Link path: ${publicPath ?? trialSessionPublicPath(form.slug || "your-slug")}. Past sessions free this slug, so you can reuse it for the next one.`}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={editingIsPast ? false : form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                disabled={editingIsPast}
                className="rounded border-zinc-600"
              />
              {editingIsPast
                ? "Registration closed — session is in the past"
                : "Registration open"}
            </label>
          </div>
        </div>

        {editingId && publicPath && !editingIsPast ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-6">
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
      </AdminFormCard>

      {editingId ? (
        <TrialSessionSignupsPanel
          sessionId={editingId}
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
      ) : null}

      <div className="mt-10 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/20 p-1 sm:w-auto sm:inline-grid">
            {TIME_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTimeFilter(option.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition sm:py-1.5",
                  timeFilter === option.id
                    ? "bg-jackals-red text-white shadow-sm"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-zinc-500">
            Showing {filteredSessions.length} of {sessions.length}
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">No one-off sessions yet.</p>
        ) : filteredSessions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No {timeFilter === "past" ? "past" : "active"} sessions.
          </p>
        ) : (
          filteredSessions.map((session) => (
            <AdminListItem
              key={session.id}
              title={session.title}
              subtitle={[
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
                session.coachName
                  ? `Coach ${session.coachName}`
                  : null,
                sessionFeeLabel(session),
                session.paymentUrl ? "Payment link set" : "No payment link",
                `${session.signupCount} approved${
                  session.pendingApprovalCount > 0
                    ? `, ${session.pendingApprovalCount} awaiting approval`
                    : ""
                }`,
                isPastSession(session) || !session.active ? "Closed" : "Open",
              ]
                .filter(Boolean)
                .join(" · ")}
              onEdit={() => startEdit(session)}
              onDuplicate={() => startDuplicate(session)}
              onDelete={() => void handleDelete(session.id)}
              deleting={deletingId === session.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
