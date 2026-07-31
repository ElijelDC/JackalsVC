"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Loader2, Mail, Users } from "lucide-react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import {
  AdminFormCard,
  AdminListItem,
  beginAdminEdit,
} from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { DEFAULT_RECLUB_USERNAME } from "@/lib/club-payment-defaults";
import { toDatetimeLocal } from "@/lib/datetime-form";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import type {
  AdminTrialSessionListItem,
  TrialSessionReminderStats,
  TrialSessionSignupRecord,
} from "@/lib/trial-session-types";
import { trialSessionReminderWindowOpensAt } from "@/lib/trial-session-reminder-window";
import { trialSessionPublicPath } from "@/lib/trial-session-types";

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
  const [form, setForm] = useState<TrialSessionFormState>(createEmptyForm);
  const [signups, setSignups] = useState<TrialSessionSignupRecord[]>([]);
  const [reminderStats, setReminderStats] =
    useState<TrialSessionReminderStats | null>(null);
  const [publicPath, setPublicPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingSignupId, setRemovingSignupId] = useState<string | null>(null);
  const [selectedSignupIds, setSelectedSignupIds] = useState<string[]>([]);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const lastLoadedSignupCountRef = useRef<number | null>(null);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setSignups([]);
    setReminderStats(null);
    setPublicPath(null);
    setSelectedSignupIds([]);
    setRegistrationsOpen(true);
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
            .filter((signup) => !signup.reminderSent)
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
    beginAdminEdit(() => {
      setEditingId(session.id);
      setForm({
        title: session.title,
        description: session.description ?? "",
        startDate: toDatetimeLocal(session.startDate),
        endDate: toDatetimeLocal(session.endDate),
        location: session.location ?? "",
        locationUrl: session.locationUrl ?? "",
        coachName: session.coachName ?? "",
        paymentUrl: session.paymentUrl ?? "",
        reclubUsername: session.reclubUsername ?? DEFAULT_RECLUB_USERNAME,
        sessionFee: session.sessionFee?.toString() ?? "",
        slug: session.slug,
        active: session.active,
      });
      setPublicPath(trialSessionPublicPath(session.slug));
      setRegistrationsOpen(true);
      setError(null);
      setMessage(null);
      setSelectedSignupIds([]);
    });
  };

  useEffect(() => {
    if (!editingId) {
      lastLoadedSignupCountRef.current = null;
      return;
    }
    void loadSignups(editingId);
  }, [editingId, loadSignups]);

  const editingSession = sessions.find((session) => session.id === editingId);
  const registrationCount =
    signups.length > 0
      ? signups.length
      : (editingSession?.signupCount ?? signups.length);

  useEffect(() => {
    if (!editingId || !editingSession || loadingSignups) return;

    const listCount = editingSession.signupCount;
    if (
      lastLoadedSignupCountRef.current !== null &&
      lastLoadedSignupCountRef.current !== listCount
    ) {
      void loadSignups(editingId);
    }
    lastLoadedSignupCountRef.current = listCount;
  }, [
    editingId,
    editingSession?.signupCount,
    editingSession,
    loadingSignups,
    loadSignups,
  ]);

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
      slug: form.slug || undefined,
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

    setMessage(editingId ? "Trial session updated." : "Trial session created.");
    if (!editingId) {
      resetForm();
    } else {
      setRegistrationsOpen(false);
      await loadSignups(editingId);
    }
    await loadSessions();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trial session and all registrations?")) return;
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

  const handleRemoveSignup = async (signupId: string) => {
    if (!editingId) return;
    if (!confirm("Remove this registration from the session?")) return;

    setRemovingSignupId(signupId);
    const result = await apiDelete(
      `/api/admin/trial-sessions/${editingId}/signups/${signupId}`,
    );
    setRemovingSignupId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Registration removed.");
    await loadSignups(editingId);
    await loadSessions();
    router.refresh();
  };

  const handleSendReminders = async () => {
    if (!editingId || !reminderStats) return;

    const idsToSend = signups
      .filter(
        (signup) =>
          selectedSignupIds.includes(signup.id) && !signup.reminderSent,
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
    await loadSessions();
    router.refresh();
  };

  const pendingSignups = signups.filter((signup) => !signup.reminderSent);
  const selectedPendingCount = pendingSignups.filter((signup) =>
    selectedSignupIds.includes(signup.id),
  ).length;
  const allPendingSelected =
    pendingSignups.length > 0 &&
    pendingSignups.every((signup) => selectedSignupIds.includes(signup.id));

  const toggleSignupSelection = (signupId: string, reminderSent: boolean) => {
    if (reminderSent) return;

    setSelectedSignupIds((current) =>
      current.includes(signupId)
        ? current.filter((id) => id !== signupId)
        : [...current, signupId],
    );
  };

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedSignupIds([]);
      return;
    }

    setSelectedSignupIds(pendingSignups.map((signup) => signup.id));
  };

  const reminderOpensAt = editingSession
    ? trialSessionReminderWindowOpensAt(editingSession.startDate)
    : null;

  return (
    <AdminSection
      title="One-off trial sessions"
      description="Create private trial session links for prospective players. Share the link directly — no login required. Attendees register with email and display name."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Create trial session"
        title={editingId ? "Edit trial session" : "Create trial session"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
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
            <Label htmlFor="trial-session-start">Start</Label>
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
            <Label htmlFor="trial-session-end">End (optional)</Label>
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
            <Label htmlFor="trial-session-coach">Trialing coach</Label>
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
            />
            <p className="mt-1 text-xs text-zinc-500">
              Link path: {publicPath ?? trialSessionPublicPath(form.slug || "your-slug")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                className="rounded border-zinc-600"
              />
              Registration open
            </label>
          </div>
        </div>

        {editingId && publicPath ? (
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

      {editingId && !registrationsOpen ? (
        <div className="mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRegistrationsOpen(true)}
          >
            Registrations ({registrationCount})
          </Button>
        </div>
      ) : null}

      {editingId && registrationsOpen ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-jackals-red-light" />
              Registrations ({registrationCount})
            </div>
            {registrationCount > 0 && reminderStats ? (
              <button
                type="button"
                onClick={() => void handleSendReminders()}
                disabled={
                  sendingReminders ||
                  !reminderStats.windowOpen ||
                  selectedPendingCount === 0
                }
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-jackals-red/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingReminders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Email reminders ({selectedPendingCount})
              </button>
            ) : null}
          </div>
          {signups.length > 0 && reminderStats ? (
            <p className="mb-4 text-xs text-zinc-500">
              {reminderStats.windowOpen
                ? reminderStats.pending > 0
                  ? "Select attendees below, then send reminders. Use Select all to include everyone who has not been emailed yet — useful for late sign-ups."
                  : "All registered attendees have already received a reminder."
                : reminderOpensAt
                  ? `Reminders open on ${format(reminderOpensAt, "EEE d MMM yyyy · HH:mm")}. Attendees are emailed automatically within 24 hours of the session.`
                  : "Attendees are emailed automatically within 24 hours of the session."}
            </p>
          ) : null}
          {signupError ? (
            <p className="mb-4 text-sm text-rose-300">{signupError}</p>
          ) : null}
          {loadingSignups ? (
            <p className="text-sm text-zinc-500">Loading registrations…</p>
          ) : signups.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {registrationCount > 0
                ? "Could not load registrations. Refresh the page or try again."
                : "No registrations yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              {pendingSignups.length > 0 && reminderStats?.windowOpen ? (
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={toggleSelectAllPending}
                    className="text-jackals-red-light transition-colors hover:text-jackals-red"
                  >
                    {allPendingSelected ? "Clear selection" : "Select all pending"}
                  </button>
                  <span className="text-zinc-600">
                    {selectedPendingCount} of {pendingSignups.length} pending
                    selected
                  </span>
                </div>
              ) : null}
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="px-3 py-2 font-medium">
                      {pendingSignups.length > 0 && reminderStats?.windowOpen ? (
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={allPendingSelected}
                            onChange={toggleSelectAllPending}
                            aria-label="Select all pending attendees"
                            className="rounded border-zinc-600"
                          />
                        </label>
                      ) : null}
                    </th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Registered</th>
                    <th className="px-3 py-2 font-medium">Reminder</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((signup) => (
                    <tr key={signup.id} className="border-b border-zinc-900/80">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedSignupIds.includes(signup.id)}
                          disabled={
                            signup.reminderSent || !reminderStats?.windowOpen
                          }
                          onChange={() =>
                            toggleSignupSelection(signup.id, signup.reminderSent)
                          }
                          aria-label={`Select ${signup.displayName}`}
                          className="rounded border-zinc-600 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2 text-zinc-200">{signup.displayName}</td>
                      <td className="px-3 py-2 text-zinc-400">{signup.email}</td>
                      <td className="px-3 py-2 text-zinc-500">
                        {format(new Date(signup.createdAt), "d MMM yyyy HH:mm")}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {signup.reminderSent ? (
                          <span className="text-emerald-400">Emailed</span>
                        ) : (
                          "Pending"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void handleRemoveSignup(signup.id)}
                          disabled={removingSignupId === signup.id}
                          className="text-sm text-rose-300 transition-colors hover:text-rose-200 disabled:opacity-50"
                        >
                          {removingSignupId === signup.id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-10 space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">No trial sessions yet.</p>
        ) : (
          sessions.map((session) => (
            <AdminListItem
              key={session.id}
              title={session.title}
              subtitle={[
                format(new Date(session.startDate), "EEE d MMM yyyy · HH:mm"),
                session.location ? session.location : null,
                session.coachName
                  ? `Trialed by Coach ${session.coachName}`
                  : null,
                sessionFeeLabel(session),
                session.paymentUrl ? "Payment link set" : "No payment link",
                `${session.signupCount} registered`,
                session.active ? "Open" : "Closed",
              ]
                .filter(Boolean)
                .join(" · ")}
              onEdit={() => startEdit(session)}
              onDelete={() => void handleDelete(session.id)}
              deleting={deletingId === session.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
