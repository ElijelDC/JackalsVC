"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Expand, Loader2, X } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminShell";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Modal } from "@/components/ui/Modal";
import { apiGet, apiPatch } from "@/lib/client-api";
import { formatInClubTime } from "@/lib/datetime-form";
import {
  TRAINING_PAYG_ATTENDANCE_STATUS_LABELS,
  type TrainingPaygAttendanceRecord,
  type TrainingPaygSettingsRecord,
} from "@/lib/player-payment-type";
import { cn, formatPrice } from "@/lib/utils";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";
type SquadFilter = "ALL" | "d2m" | "d3w" | "d3m";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "PENDING", label: "Awaiting" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ALL", label: "All" },
];

const SQUAD_FILTERS: {
  id: SquadFilter;
  label: string;
  keys: string[] | null;
}[] = [
  { id: "ALL", label: "All squads", keys: null },
  { id: "d2m", label: "d2m", keys: ["DIV2_MENS"] },
  { id: "d3w", label: "d3w", keys: ["DIV3_WOMENS"] },
  { id: "d3m", label: "d3m", keys: ["DIV3_MENS", "DIV4_MENS"] },
];

function statusTone(status: string) {
  if (status === "APPROVED") return "text-emerald-300 bg-emerald-500/10";
  if (status === "PENDING" || status === "AWAITING_PROOF") {
    return "text-amber-300 bg-amber-500/10";
  }
  return "text-rose-300 bg-rose-500/10";
}

function squadShortLabel(trainingTeamKey: string | null | undefined) {
  if (!trainingTeamKey) return null;
  if (trainingTeamKey === "DIV2_MENS") return "d2m";
  if (trainingTeamKey === "DIV3_WOMENS") return "d3w";
  if (trainingTeamKey === "DIV3_MENS" || trainingTeamKey === "DIV4_MENS") {
    return "d3m";
  }
  return trainingTeamKey;
}

function matchesSquadFilter(
  row: TrainingPaygAttendanceRecord,
  squad: SquadFilter,
) {
  const filter = SQUAD_FILTERS.find((item) => item.id === squad);
  if (!filter?.keys) return true;
  return Boolean(
    row.trainingTeamKey && filter.keys.includes(row.trainingTeamKey),
  );
}

export function TrainingPaygAdminManager({
  initialSettings,
  initialAttendances,
}: {
  initialSettings: TrainingPaygSettingsRecord;
  initialAttendances: TrainingPaygAttendanceRecord[];
}) {
  const refreshNotifications = useRefreshAdminNotifications();
  const [settings, setSettings] = useState(initialSettings);
  const [feeInput, setFeeInput] = useState(String(initialSettings.sessionFeeEur));
  const [paymentUrl, setPaymentUrl] = useState(initialSettings.paymentUrl);
  const [active, setActive] = useState(initialSettings.active);
  const [attendances, setAttendances] = useState(initialAttendances);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [squadFilter, setSquadFilter] = useState<SquadFilter>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TrainingPaygAttendanceRecord | null>(
    null,
  );

  const reload = useCallback(async () => {
    const result = await apiGet<{ attendances: TrainingPaygAttendanceRecord[] }>(
      "/api/admin/training-payg/attendances",
      "Could not load receipts",
    );
    if (result.ok) setAttendances(result.data.attendances);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    return attendances.filter((row) => {
      const statusOk =
        statusFilter === "ALL"
          ? true
          : statusFilter === "PENDING"
            ? row.status === "PENDING" || row.status === "AWAITING_PROOF"
            : row.status === statusFilter;
      return statusOk && matchesSquadFilter(row, squadFilter);
    });
  }, [attendances, statusFilter, squadFilter]);

  const pendingVisible = useMemo(
    () => visible.filter((row) => row.status === "PENDING"),
    [visible],
  );

  const pendingCount = attendances.filter((row) => row.status === "PENDING")
    .length;

  const allPendingSelected =
    pendingVisible.length > 0 &&
    pendingVisible.every((row) => selectedIds.includes(row.id));

  const selectedPendingIds = selectedIds.filter((id) =>
    pendingVisible.some((row) => row.id === id),
  );

  useEffect(() => {
    const visibleIds = new Set(visible.map((row) => row.id));
    setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [visible]);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSettings(true);
    setError(null);
    setMessage(null);

    const sessionFeeEur = Number(feeInput);
    if (!Number.isFinite(sessionFeeEur) || sessionFeeEur <= 0) {
      setSavingSettings(false);
      setError("Enter a valid session fee");
      return;
    }

    const result = await apiPatch<{ settings: TrainingPaygSettingsRecord }>(
      "/api/admin/training-payg/settings",
      { sessionFeeEur, paymentUrl, active },
      "Could not save settings",
    );

    setSavingSettings(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSettings(result.data.settings);
    setMessage("Pay Per Training settings saved");
  };

  const applyLocalStatus = (ids: string[], status: "APPROVED" | "REJECTED") => {
    const idSet = new Set(ids);
    setAttendances((current) =>
      current.map((row) => (idSet.has(row.id) ? { ...row, status } : row)),
    );
    setSelectedIds((current) => current.filter((id) => !idSet.has(id)));
  };

  const reviewOne = async (
    row: TrainingPaygAttendanceRecord,
    status: "APPROVED" | "REJECTED",
  ) => {
    const previous = attendances;
    applyLocalStatus([row.id], status);
    setUpdatingIds((ids) => [...ids, row.id]);
    setError(null);

    const result = await apiPatch<{
      attendance: TrainingPaygAttendanceRecord;
      message: string;
    }>(
      `/api/admin/training-payg/attendances/${row.id}`,
      { status },
      "Could not update attendance",
    );

    setUpdatingIds((ids) => ids.filter((id) => id !== row.id));

    if (!result.ok) {
      setAttendances(previous);
      setError(result.error);
      return;
    }

    setAttendances((current) =>
      current.map((item) =>
        item.id === row.id ? result.data.attendance : item,
      ),
    );
    void refreshNotifications();
    setMessage(result.data.message);
  };

  const reviewBatch = async (status: "APPROVED" | "REJECTED") => {
    if (selectedPendingIds.length === 0) return;

    const previous = attendances;
    const ids = [...selectedPendingIds];
    applyLocalStatus(ids, status);
    setBatchBusy(true);
    setError(null);

    const result = await apiPatch<{
      attendances: TrainingPaygAttendanceRecord[];
      count: number;
      message: string;
    }>(
      "/api/admin/training-payg/attendances",
      { attendanceIds: ids, status },
      "Could not update receipts",
    );

    setBatchBusy(false);

    if (!result.ok) {
      setAttendances(previous);
      setError(result.error);
      return;
    }

    const byId = new Map(
      result.data.attendances.map((row) => [row.id, row] as const),
    );
    setAttendances((current) =>
      current.map((row) => byId.get(row.id) ?? row),
    );
    void refreshNotifications();
    setMessage(result.data.message);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const toggleSelectAllPending = () => {
    setSelectedIds(
      allPendingSelected ? [] : pendingVisible.map((row) => row.id),
    );
  };

  return (
    <AdminSection
      title="Pay Per Training"
      description="Club-wide session fee and receipt review for squad players paying per session."
    >
      <SuccessBanner message={message} />
      <FormError message={error} />

      <details className="group mb-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
          <div>
            <p className="font-display text-sm font-semibold text-white">
              Session fee settings
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatPrice(settings.sessionFeeEur, "EUR")} ·{" "}
              {settings.active ? "Active" : "Disabled"}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-180" />
        </summary>
        <form
          onSubmit={(event) => void saveSettings(event)}
          className="space-y-4 border-t border-white/10 px-4 py-4 sm:px-5"
        >
          <p className="text-sm text-zinc-400">
            One fee applies to all weekly training sessions.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="payg-fee">Session fee (EUR)</Label>
              <Input
                id="payg-fee"
                type="number"
                min="0.01"
                step="0.01"
                value={feeInput}
                onChange={(event) => setFeeInput(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payg-active">Status</Label>
              <select
                id="payg-active"
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                value={active ? "true" : "false"}
                onChange={(event) => setActive(event.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="payg-url">Optional payment link</Label>
            <Input
              id="payg-url"
              value={paymentUrl}
              onChange={(event) => setPaymentUrl(event.target.value)}
              placeholder="https://…"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Members always see the club IBAN.
            </p>
          </div>
          <Button type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </details>

      <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Receipt review
            </h2>
            <p className="text-sm text-zinc-400">
              {pendingCount === 0
                ? "No receipts waiting"
                : `${pendingCount} waiting for review`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={statusFilter === item.id ? "primary" : "outline"}
                onClick={() => setStatusFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SQUAD_FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={squadFilter === item.id ? "primary" : "outline"}
              onClick={() => setSquadFilter(item.id)}
              className="uppercase tracking-wide"
            >
              {item.label}
            </Button>
          ))}
        </div>

        {pendingVisible.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={toggleSelectAllPending}
                className="h-4 w-4 rounded border-white/20 bg-black/40"
              />
              Select all awaiting ({pendingVisible.length})
            </label>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={batchBusy || selectedPendingIds.length === 0}
                onClick={() => void reviewBatch("APPROVED")}
                className="gap-1"
              >
                {batchBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Approve selected ({selectedPendingIds.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={batchBusy || selectedPendingIds.length === 0}
                onClick={() => void reviewBatch("REJECTED")}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Reject selected
              </Button>
            </div>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing in this filter.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((row) => {
              const busy = updatingIds.includes(row.id) || batchBusy;
              const pending = row.status === "PENDING";
              const squad = squadShortLabel(row.trainingTeamKey);

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex items-start gap-3 lg:w-[14rem] lg:shrink-0">
                      {pending ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40"
                          aria-label={`Select ${row.memberName ?? "member"}`}
                        />
                      ) : (
                        <span className="mt-1 h-4 w-4" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {row.memberName ?? "Member"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {row.memberEmail ?? "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {squad ? (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                              {squad}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              statusTone(row.status),
                            )}
                          >
                            {TRAINING_PAYG_ATTENDANCE_STATUS_LABELS[row.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-zinc-200">
                        {row.eventTitle ?? "Training"}
                      </p>
                      {row.eventStartDate ? (
                        <p className="text-xs text-zinc-500">
                          {formatInClubTime(row.eventStartDate, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hourCycle: "h23",
                          })}
                        </p>
                      ) : null}
                      <p className="text-sm text-zinc-300">
                        {formatPrice(row.amountDue, "EUR")}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {row.paymentReference}
                      </p>
                    </div>

                    <div className="w-28 shrink-0 sm:w-32">
                      {row.proofScreenshotUrl ? (
                        <button
                          type="button"
                          onClick={() => setReceipt(row)}
                          className="group relative block h-24 w-full overflow-hidden rounded-lg border border-white/15 bg-black/40 text-left hover:border-white/30 sm:h-28"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.proofScreenshotUrl}
                            alt={`Receipt for ${row.memberName ?? "member"}`}
                            className="h-full w-full bg-zinc-950 object-cover object-top"
                          />
                          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/75 py-1 text-[10px] font-medium text-white">
                            <Expand className="h-3 w-3" /> Full size
                          </span>
                        </button>
                      ) : (
                        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 text-[10px] text-zinc-500 sm:h-28">
                          No receipt
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:w-36 lg:shrink-0 lg:flex-col">
                      {pending ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void reviewOne(row, "APPROVED")}
                            className="gap-1"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void reviewOne(row, "REJECTED")}
                            className="gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Payment receipt"
        description={
          receipt ? (
            <p className="text-sm text-zinc-400">
              {receipt.memberName} · {receipt.paymentReference}
            </p>
          ) : null
        }
        className="max-w-3xl"
      >
        {receipt?.proofScreenshotUrl ? (
          <a
            href={receipt.proofScreenshotUrl}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receipt.proofScreenshotUrl}
              alt="Payment receipt"
              className="max-h-[75vh] w-full rounded-lg border border-white/10 bg-black object-contain"
            />
          </a>
        ) : (
          <p className="text-sm text-zinc-500">No receipt uploaded.</p>
        )}
      </Modal>
    </AdminSection>
  );
}
