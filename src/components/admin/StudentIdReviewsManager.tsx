"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { apiGet, apiPatch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export type StudentIdReviewItem = {
  id: string;
  planName: string;
  studentIdProofUrl: string;
  studentIdProofSubmittedAt: string | null;
  studentIdReviewStatus: string | null;
  user: { id: string; name: string; email: string };
};

function formatSubmittedAt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function StudentIdReviewsManager({
  initialReviews,
}: {
  initialReviews: StudentIdReviewItem[];
}) {
  const router = useRouter();
  const refreshNotifications = useRefreshAdminNotifications();
  const [reviews, setReviews] = useState(initialReviews);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialReviews[0]?.id ?? null,
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, action: "approve" | "decline") => {
    setLoadingId(id);
    setError(null);

    const result = await apiPatch<{
      review: { id: string; studentIdReviewStatus: string };
    }>(
      `/api/admin/student-id-reviews/${id}`,
      { action },
      action === "approve"
        ? "approve this student ID"
        : "decline this student ID",
    );

    setLoadingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setReviews((prev) => prev.filter((row) => row.id !== id));
    setExpandedId((current) => (current === id ? null : current));
    refreshNotifications();
    router.refresh();
  };

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    const result = await apiGet<{ reviews: StudentIdReviewItem[] }>(
      "/api/admin/student-id-reviews",
      "Could not refresh student ID reviews",
    );
    setRefreshing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReviews(result.data.reviews);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {reviews.length === 0
            ? "No Student/U18 IDs waiting for review."
            : `${reviews.length} Student/U18 ID${reviews.length === 1 ? "" : "s"} to review`}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void refresh()}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <FormError message={error} />

      <div className="space-y-3">
        {reviews.map((review) => {
          const open = expandedId === review.id;
          return (
            <div
              key={review.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
            >
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : review.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{review.user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {review.user.email} · {review.planName}
                    {review.studentIdProofSubmittedAt
                      ? ` · ${formatSubmittedAt(review.studentIdProofSubmittedAt)}`
                      : ""}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-500 transition",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open ? (
                <div className="space-y-4 border-t border-white/10 px-4 py-4">
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    <Image
                      src={review.studentIdProofUrl}
                      alt={`Student ID for ${review.user.name}`}
                      fill
                      className="object-contain"
                      sizes="400px"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={loadingId === review.id}
                      onClick={() => void act(review.id, "approve")}
                      className="gap-2"
                    >
                      {loadingId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Approve Student/U18
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loadingId === review.id}
                      onClick={() => void act(review.id, "decline")}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Declining asks them to upload a clearer ID from membership.
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
