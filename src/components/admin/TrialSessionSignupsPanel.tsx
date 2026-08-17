"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  Mail,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatInClubTime } from "@/lib/datetime-form";
import { apiPatch } from "@/lib/client-api";
import type {
  TrialSessionReminderStats,
  TrialSessionSignupRecord,
  TrialSessionSignupStatus,
} from "@/lib/trial-session-types";
import { TRIAL_SESSION_SIGNUP_STATUS_LABELS } from "@/lib/trial-session-types";
import { cn } from "@/lib/utils";

type SignupFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const FILTERS: { id: SignupFilter; label: string }[] = [
  { id: "PENDING", label: "Awaiting" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ALL", label: "All" },
];

function formatSubmittedAt(iso: string) {
  return formatInClubTime(iso, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function statusClassName(status: TrialSessionSignupStatus) {
  if (status === "APPROVED") return "text-emerald-400";
  if (status === "PENDING") return "text-amber-300";
  return "text-rose-300";
}

export function TrialSessionSignupsPanel({
  sessionId,
  signups,
  reminderStats,
  reminderOpensAt,
  loading,
  error,
  selectedSignupIds,
  sendingReminders,
  onSignupsChange,
  onError,
  onSelectSignupIds,
  onSendReminders,
}: {
  sessionId: string;
  signups: TrialSessionSignupRecord[];
  reminderStats: TrialSessionReminderStats | null;
  reminderOpensAt: Date | null;
  loading: boolean;
  error: string | null;
  selectedSignupIds: string[];
  sendingReminders: boolean;
  onSignupsChange: (signups: TrialSessionSignupRecord[]) => void;
  onError: (error: string | null) => void;
  onSelectSignupIds: (ids: string[]) => void;
  onSendReminders: () => void;
}) {
  const [filter, setFilter] = useState<SignupFilter>("PENDING");
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [receiptSignup, setReceiptSignup] =
    useState<TrialSessionSignupRecord | null>(null);

  const pendingSignups = useMemo(
    () => signups.filter((signup) => signup.status === "PENDING"),
    [signups],
  );
  const approvedSignups = useMemo(
    () => signups.filter((signup) => signup.status === "APPROVED"),
    [signups],
  );
  const rejectedCount = signups.filter(
    (signup) => signup.status === "REJECTED",
  ).length;

  const visibleSignups = useMemo(() => {
    if (filter === "ALL") return signups;
    return signups.filter((signup) => signup.status === filter);
  }, [filter, signups]);

  const reminderEligibleSignups = signups.filter(
    (signup) => signup.status === "APPROVED" && !signup.reminderSent,
  );
  const selectedPendingCount = reminderEligibleSignups.filter((signup) =>
    selectedSignupIds.includes(signup.id),
  ).length;
  const allPendingSelected =
    reminderEligibleSignups.length > 0 &&
    reminderEligibleSignups.every((signup) =>
      selectedSignupIds.includes(signup.id),
    );

  const busy = updatingIds.length > 0;

  const applyStatus = (
    ids: string[],
    status: TrialSessionSignupStatus,
  ) => {
    const idSet = new Set(ids);
    onSignupsChange(
      signups.map((signup) =>
        idSet.has(signup.id) ? { ...signup, status } : signup,
      ),
    );
  };

  const updateStatus = async (
    ids: string[],
    status: TrialSessionSignupStatus,
  ) => {
    if (ids.length === 0) return;
    const previous = signups;
    applyStatus(ids, status);
    setUpdatingIds(ids);
    onError(null);

    const result =
      ids.length === 1
        ? await apiPatch<{ message: string }>(
            `/api/admin/trial-sessions/${sessionId}/signups/${ids[0]}`,
            { status },
            "update signup status",
          )
        : await apiPatch<{ message: string }>(
            `/api/admin/trial-sessions/${sessionId}/signups`,
            { signupIds: ids, status },
            "update signup status",
          );

    setUpdatingIds([]);

    if (!result.ok) {
      onSignupsChange(previous);
      onError(result.error);
      return;
    }

    if (status === "APPROVED" && filter === "PENDING") {
      const remainingPending = previous.filter(
        (signup) => !ids.includes(signup.id) && signup.status === "PENDING",
      ).length;
      if (remainingPending === 0) setFilter("APPROVED");
    }
  };

  const toggleSignupSelection = (signup: TrialSessionSignupRecord) => {
    if (signup.reminderSent || signup.status !== "APPROVED") return;
    onSelectSignupIds(
      selectedSignupIds.includes(signup.id)
        ? selectedSignupIds.filter((id) => id !== signup.id)
        : [...selectedSignupIds, signup.id],
    );
  };

  const toggleSelectAllPending = () => {
    onSelectSignupIds(
      allPendingSelected
        ? []
        : reminderEligibleSignups.map((signup) => signup.id),
    );
  };

  return (
    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-jackals-red-light" />
            Registrations
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {pendingSignups.length} awaiting
            {approvedSignups.length > 0
              ? ` · ${approvedSignups.length} approved`
              : ""}
            {rejectedCount > 0 ? ` · ${rejectedCount} rejected` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingSignups.length > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() =>
                void updateStatus(
                  pendingSignups.map((signup) => signup.id),
                  "APPROVED",
                )
              }
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve all awaiting
            </Button>
          ) : null}
          {(approvedSignups.length > 0 || pendingSignups.length > 0) &&
          reminderStats ? (
            <button
              type="button"
              onClick={onSendReminders}
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
      </div>

      {signups.length > 0 && reminderStats ? (
        <p className="mb-4 text-xs text-zinc-500">
          {reminderStats.windowOpen
            ? reminderStats.pending > 0
              ? "Select approved attendees, then send reminders. Use Select all for anyone not emailed yet."
              : "All registered attendees have already received a reminder."
            : reminderOpensAt
              ? `Reminders open on ${formatInClubTime(reminderOpensAt, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                })}. Attendees are emailed automatically within 24 hours of the session.`
              : "Attendees are emailed automatically within 24 hours of the session."}
        </p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading registrations…</p>
      ) : signups.length === 0 ? (
        <p className="text-sm text-zinc-500">No registrations yet.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-4 gap-1 rounded-lg bg-black/20 p-1">
            {FILTERS.map((option) => {
              const count =
                option.id === "ALL"
                  ? signups.length
                  : signups.filter((signup) => signup.status === option.id)
                      .length;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={cn(
                    "rounded-md px-2 py-2 text-xs font-medium transition sm:text-sm",
                    filter === option.id
                      ? "bg-jackals-red text-white shadow-sm"
                      : "text-zinc-400 hover:text-white",
                  )}
                >
                  {option.label}
                  <span className="ml-1 text-[11px] opacity-80">{count}</span>
                </button>
              );
            })}
          </div>

          {filter === "APPROVED" &&
          reminderEligibleSignups.length > 0 &&
          reminderStats?.windowOpen ? (
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                onClick={toggleSelectAllPending}
                className="text-jackals-red-light transition-colors hover:text-jackals-red"
              >
                {allPendingSelected ? "Clear selection" : "Select all"}
              </button>
              <span className="text-zinc-600">
                {selectedPendingCount} of {reminderEligibleSignups.length}{" "}
                reminder-eligible selected
              </span>
            </div>
          ) : null}

          {visibleSignups.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No {filter === "ALL" ? "" : FILTERS.find((item) => item.id === filter)?.label.toLowerCase() + " "}
              requests.
            </p>
          ) : filter === "PENDING" ? (
            <div className="grid gap-3">
              {visibleSignups.map((signup) => {
                const updating = updatingIds.includes(signup.id);
                return (
                  <article
                    key={signup.id}
                    className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {signup.displayName}
                          </p>
                          <p className="truncate text-sm text-zinc-400">
                            {signup.email}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Submitted {formatSubmittedAt(signup.createdAt)}
                          </p>
                        </div>
                        {signup.paymentProofUrl ? (
                          <button
                            type="button"
                            onClick={() => setReceiptSignup(signup)}
                            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={signup.paymentProofUrl}
                              alt={`Receipt from ${signup.displayName}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/10 text-zinc-600">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={updating || busy}
                        onClick={() => void updateStatus([signup.id], "APPROVED")}
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updating || busy}
                        className="border-rose-500/30 text-rose-200 hover:border-rose-400/50 hover:bg-rose-500/10"
                        onClick={() => void updateStatus([signup.id], "REJECTED")}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 overflow-hidden rounded-xl border border-white/10">
              {visibleSignups.map((signup) => {
                const updating = updatingIds.includes(signup.id);
                return (
                  <div
                    key={signup.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {filter === "APPROVED" && reminderStats?.windowOpen ? (
                        <input
                          type="checkbox"
                          checked={selectedSignupIds.includes(signup.id)}
                          disabled={
                            signup.reminderSent || signup.status !== "APPROVED"
                          }
                          onChange={() => toggleSignupSelection(signup)}
                          aria-label={`Select ${signup.displayName}`}
                          className="mt-1 rounded border-zinc-600 disabled:opacity-40"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">
                          {signup.displayName}
                        </p>
                        <p className="truncate text-sm text-zinc-500">
                          {signup.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className={statusClassName(signup.status)}>
                        {TRIAL_SESSION_SIGNUP_STATUS_LABELS[signup.status]}
                      </span>
                      {signup.paymentProofUrl ? (
                        <button
                          type="button"
                          onClick={() => setReceiptSignup(signup)}
                          className="text-jackals-red-light hover:text-jackals-red"
                        >
                          Receipt
                        </button>
                      ) : null}
                      {signup.status === "APPROVED" ? (
                        <span className="text-zinc-500">
                          {signup.reminderSent ? "Emailed" : "Reminder pending"}
                        </span>
                      ) : null}
                      {signup.status === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            disabled={updating || busy}
                            onClick={() =>
                              void updateStatus([signup.id], "APPROVED")
                            }
                            className="text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={updating || busy}
                            onClick={() =>
                              void updateStatus([signup.id], "REJECTED")
                            }
                            className="text-rose-300 hover:text-rose-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(receiptSignup)}
        onClose={() => setReceiptSignup(null)}
        title={receiptSignup ? `Receipt · ${receiptSignup.displayName}` : "Receipt"}
        description={
          receiptSignup ? (
            <p className="text-sm text-zinc-400">{receiptSignup.email}</p>
          ) : null
        }
        className="max-w-[min(100%,40rem)]"
      >
        {receiptSignup?.paymentProofUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={receiptSignup.paymentProofUrl}
            alt={`Payment receipt from ${receiptSignup.displayName}`}
            className="w-full rounded-lg border border-white/10"
          />
        ) : (
          <p className="text-sm text-zinc-500">No receipt uploaded.</p>
        )}
      </Modal>
    </div>
  );
}
