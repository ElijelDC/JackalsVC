"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Expand, Loader2, X } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminShell";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { Button } from "@/components/ui/Button";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Modal } from "@/components/ui/Modal";
import { apiGet, apiPatch } from "@/lib/client-api";
import { formatInClubTime } from "@/lib/datetime-form";
import {
  STUDENT_ID_REVIEW_STATUS_LABELS,
  type StudentIdReviewRecord,
  type StudentIdReviewStatus,
} from "@/lib/student-id-proof";
import { cn } from "@/lib/utils";

type StatusFilter =
  | "PENDING"
  | "AWAITING_PROOF"
  | "APPROVED"
  | "DECLINED"
  | "ALL";

function isAwaitingReview(row: StudentIdReviewRecord) {
  return (
    row.studentIdReviewStatus === "PENDING" &&
    Boolean(row.studentIdProofUrl?.startsWith("/"))
  );
}

function statusTone(status: StudentIdReviewStatus) {
  if (status === "APPROVED") return "text-emerald-300 bg-emerald-500/10";
  if (status === "PENDING" || status === "AWAITING_PROOF") {
    return "text-amber-300 bg-amber-500/10";
  }
  return "text-rose-300 bg-rose-500/10";
}

function StudentIdThumb({
  url,
  alt,
  onOpen,
}: {
  url: string | null;
  alt: string;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex h-24 w-full flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-white/10 bg-black/20 px-2 text-center hover:border-white/20 sm:h-28"
      >
        <span className="text-[10px] font-medium text-zinc-400">
          {url && failed ? "ID unavailable" : "No ID uploaded"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block h-24 w-full overflow-hidden rounded-lg border border-white/15 bg-black/40 text-left hover:border-white/30 sm:h-28"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="h-full w-full bg-zinc-950 object-cover object-top"
        onError={() => setFailed(true)}
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/75 py-1 text-[10px] font-medium text-white">
        <Expand className="h-3 w-3" /> Full size
      </span>
    </button>
  );
}

function StudentIdModalImage({
  url,
  onApprove,
  approving,
}: {
  url: string;
  onApprove?: () => void;
  approving: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (failed) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
        ID image could not be loaded.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <a href={url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Student / U18 ID"
          className="max-h-[75vh] w-full rounded-lg border border-white/10 bg-black object-contain"
          onError={() => setFailed(true)}
        />
      </a>
      {onApprove ? (
        <Button
          type="button"
          className="w-full gap-1"
          disabled={approving}
          onClick={onApprove}
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
      ) : null}
    </div>
  );
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "PENDING", label: "To review" },
  { id: "AWAITING_PROOF", label: "No ID yet" },
  { id: "APPROVED", label: "Approved" },
  { id: "DECLINED", label: "Declined" },
  { id: "ALL", label: "All" },
];

export function StudentIdReviewsManager({
  initialReviews,
}: {
  initialReviews: StudentIdReviewRecord[];
}) {
  const refreshNotifications = useRefreshAdminNotifications();
  const [reviews, setReviews] = useState(initialReviews);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<StudentIdReviewRecord | null>(null);

  const reload = useCallback(async () => {
    const result = await apiGet<{ reviews: StudentIdReviewRecord[] }>(
      "/api/admin/student-id-reviews",
      "Could not load student ID reviews",
    );
    if (result.ok) setReviews(result.data.reviews);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    return reviews.filter((row) =>
      statusFilter === "ALL" ? true : row.studentIdReviewStatus === statusFilter,
    );
  }, [reviews, statusFilter]);

  const pendingVisible = useMemo(
    () => visible.filter((row) => isAwaitingReview(row)),
    [visible],
  );

  const pendingCount = reviews.filter((row) => isAwaitingReview(row)).length;

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

  const applyLocalStatus = (
    ids: string[],
    status: StudentIdReviewStatus,
  ) => {
    const idSet = new Set(ids);
    setReviews((current) =>
      current.map((row) =>
        idSet.has(row.id) ? { ...row, studentIdReviewStatus: status } : row,
      ),
    );
    setSelectedIds((current) => current.filter((id) => !idSet.has(id)));
  };

  const reviewOne = async (
    row: StudentIdReviewRecord,
    action: "approve" | "decline",
  ): Promise<boolean> => {
    if (!isAwaitingReview(row)) return false;

    const previous = reviews;
    const optimisticStatus = action === "approve" ? "APPROVED" : "DECLINED";
    applyLocalStatus([row.id], optimisticStatus);
    setUpdatingIds((ids) => [...ids, row.id]);
    setError(null);

    const result = await apiPatch<{
      review: StudentIdReviewRecord;
      message: string;
    }>(
      `/api/admin/student-id-reviews/${row.id}`,
      { action },
      action === "approve"
        ? "approve this student ID"
        : "decline this student ID",
    );

    setUpdatingIds((ids) => ids.filter((id) => id !== row.id));

    if (!result.ok) {
      setReviews(previous);
      setError(result.error);
      return false;
    }

    setReviews((current) =>
      current.map((item) =>
        item.id === row.id ? result.data.review : item,
      ),
    );
    void refreshNotifications();
    setMessage(result.data.message);
    return true;
  };

  const reviewBatch = async (action: "approve" | "decline") => {
    if (selectedPendingIds.length === 0) return;

    const previous = reviews;
    const ids = [...selectedPendingIds];
    applyLocalStatus(ids, action === "approve" ? "APPROVED" : "DECLINED");
    setBatchBusy(true);
    setError(null);

    const result = await apiPatch<{
      reviews: StudentIdReviewRecord[];
      count: number;
      message: string;
    }>(
      "/api/admin/student-id-reviews",
      { membershipIds: ids, action },
      "Could not update student ID reviews",
    );

    setBatchBusy(false);

    if (!result.ok) {
      setReviews(previous);
      setError(result.error);
      return;
    }

    const byId = new Map(
      result.data.reviews.map((row) => [row.id, row] as const),
    );
    setReviews((current) =>
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
      title="Student / U18 ID reviews"
      description="Approve student or under-18 ID photos before confirming the discounted rate. Members who joined before ID upload was required appear under “No ID yet” until they upload."
    >
      <SuccessBanner message={message} />
      <FormError message={error} />

      <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              ID review
            </h2>
            <p className="text-sm text-zinc-400">
              {pendingCount === 0
                ? "No IDs waiting for review"
                : `${pendingCount} ID${pendingCount === 1 ? "" : "s"} waiting for review`}
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
                onClick={() => void reviewBatch("approve")}
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
                onClick={() => void reviewBatch("decline")}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Decline selected
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
              const awaitingReview = isAwaitingReview(row);

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex items-start gap-3 lg:w-[14rem] lg:shrink-0">
                      {awaitingReview ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40"
                          aria-label={`Select ${row.user.name}`}
                        />
                      ) : (
                        <span className="mt-1 h-4 w-4" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white">{row.user.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {row.user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                            {row.planName}
                          </span>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              statusTone(row.studentIdReviewStatus),
                            )}
                          >
                            {
                              STUDENT_ID_REVIEW_STATUS_LABELS[
                                row.studentIdReviewStatus
                              ]
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-zinc-200">Student / U18 ID</p>
                      {row.studentIdProofSubmittedAt ? (
                        <p className="text-xs text-zinc-500">
                          Submitted{" "}
                          {formatInClubTime(row.studentIdProofSubmittedAt, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hourCycle: "h23",
                          })}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          Waiting for member to upload ID
                        </p>
                      )}
                      {row.studentIdReviewNote ? (
                        <p className="text-xs text-zinc-500">
                          Note: {row.studentIdReviewNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="w-28 shrink-0 sm:w-32">
                      <StudentIdThumb
                        url={row.studentIdProofUrl}
                        alt={`Student ID for ${row.user.name}`}
                        onOpen={() => setPreview(row)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 lg:w-36 lg:shrink-0 lg:flex-col">
                      {awaitingReview ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void reviewOne(row, "approve")}
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
                            onClick={() => void reviewOne(row, "decline")}
                            className="gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            Decline
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
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Student / U18 ID"
        description={
          preview ? (
            <p className="text-sm text-zinc-400">
              {preview.user.name} · {preview.user.email}
            </p>
          ) : null
        }
        className="max-w-3xl"
      >
        {preview?.studentIdProofUrl ? (
          <StudentIdModalImage
            url={preview.studentIdProofUrl}
            onApprove={
              isAwaitingReview(preview)
                ? () => {
                    void reviewOne(preview, "approve");
                    setPreview(null);
                  }
                : undefined
            }
            approving={updatingIds.includes(preview.id) || batchBusy}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-500">
            No ID uploaded yet. The member must upload from their membership
            page.
          </p>
        )}
        {preview && isAwaitingReview(preview) && preview.studentIdProofUrl ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full gap-1"
            disabled={updatingIds.includes(preview.id) || batchBusy}
            onClick={() => {
              void reviewOne(preview, "decline").then((ok) => {
                if (ok) setPreview(null);
              });
            }}
          >
            <X className="h-4 w-4" />
            Decline
          </Button>
        ) : null}
      </Modal>
    </AdminSection>
  );
}
