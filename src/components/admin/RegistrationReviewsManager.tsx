"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError, WarningBanner } from "@/components/ui/FormMessage";
import { apiGet, apiPatch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export type RegistrationReviewItem = {
  id: string;
  vlyNumber: string;
  name: string;
  vlyMembershipPhotoUrl: string;
  registrationPhotoSubmittedAt: string | null;
  rosterRole: string;
  trainingTeamKey: string | null;
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

function roleLabel(review: RegistrationReviewItem) {
  const base = review.rosterRole === "COACH" ? "Coach" : "Player";
  if (!review.trainingTeamKey) return base;
  return `${base} · ${review.trainingTeamKey.replaceAll("-", " ")}`;
}

export function RegistrationReviewsManager({
  initialReviews,
}: {
  initialReviews: RegistrationReviewItem[];
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const act = async (id: string, action: "approve" | "decline") => {
    setLoadingId(id);
    setError(null);
    setWarning(null);

    const result = await apiPatch<{
      review: {
        id: string;
        registrationReviewStatus: string;
        registrationReviewedAt: string | null;
      };
      emailWarning?: string | null;
    }>(
      `/api/admin/registration-reviews/${id}`,
      { action },
      action === "approve"
        ? "approve this registration"
        : "decline this registration",
    );

    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.data.emailWarning) {
      setWarning(result.data.emailWarning);
    }

    setReviews((current) => current.filter((review) => review.id !== id));
    if (expandedId === id) setExpandedId(null);
    router.refresh();
  };

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    setWarning(null);
    const result = await apiGet<{ reviews: RegistrationReviewItem[] }>(
      "/api/admin/registration-reviews",
      "refresh the registration list",
    );
    setRefreshing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReviews(result.data.reviews);
  };

  const renderActions = (review: RegistrationReviewItem) => {
    const loading = loadingId === review.id;
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          title="Approve"
          disabled={loading}
          onClick={() => void act(review.id, "approve")}
          className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          title="Decline"
          disabled={loading}
          onClick={() => void act(review.id, "decline")}
          className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const renderExpanded = (review: RegistrationReviewItem) => {
    const loading = loadingId === review.id;
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Membership photo
          </p>
          <div className="relative mx-auto mt-2 h-48 w-36 overflow-hidden rounded-lg border border-white/10 bg-black/30 lg:mx-0">
            <Image
              src={review.vlyMembershipPhotoUrl}
              alt={`VLY membership photo for ${review.name}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-500">VLY:</span>{" "}
            <span className="font-mono text-jackals-red-light">
              {review.vlyNumber}
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Role:</span> {roleLabel(review)}
          </p>
          {review.registrationPhotoSubmittedAt ? (
            <p className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock3 className="h-3.5 w-3.5" />
              Submitted {formatSubmittedAt(review.registrationPhotoSubmittedAt)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => void act(review.id, "approve")}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              className="border-rose-500/30 text-rose-200 hover:border-rose-400/50 hover:bg-rose-500/10"
              onClick={() => void act(review.id, "decline")}
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400/80" />
        <p className="mt-4 font-display text-lg font-semibold text-white">
          No pending registrations
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          New member sign-ups waiting for photo approval will appear here.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-6"
          onClick={() => void refresh()}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {reviews.length} registration{reviews.length === 1 ? "" : "s"}{" "}
          awaiting review
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      <FormError message={error} />
      <WarningBanner message={warning} />

      <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col />
            <col className="w-[5.5rem]" />
            <col className="w-[7rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[5.5rem]" />
          </colgroup>
          <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-2 py-2.5 font-medium">Name</th>
              <th className="px-2 py-2.5 font-medium">VLY</th>
              <th className="px-2 py-2.5 font-medium">Role</th>
              <th className="px-2 py-2.5 font-medium">Submitted</th>
              <th className="px-2 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {reviews.map((review) => {
              const expanded = expandedId === review.id;
              return (
                <Fragment key={review.id}>
                  <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : review.id)
                        }
                        className="group flex min-w-0 items-center gap-1.5 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                            expanded && "rotate-180",
                          )}
                        />
                        <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                          {review.name}
                        </span>
                      </button>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-jackals-red-light">
                      {review.vlyNumber}
                    </td>
                    <td className="px-2 py-2 text-xs text-zinc-400">
                      <span className="truncate">
                        {review.rosterRole === "COACH" ? "Coach" : "Player"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-zinc-500 whitespace-nowrap">
                      {review.registrationPhotoSubmittedAt
                        ? formatSubmittedAt(review.registrationPhotoSubmittedAt)
                        : "—"}
                    </td>
                    <td className="px-2 py-2">{renderActions(review)}</td>
                  </tr>
                  {expanded ? (
                    <tr className="bg-black/20">
                      <td colSpan={5} className="px-4 py-4">
                        {renderExpanded(review)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 lg:hidden">
        {reviews.map((review) => {
          const expanded = expandedId === review.id;
          const loading = loadingId === review.id;
          return (
            <article
              key={review.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : review.id)}
                    className="group flex min-w-0 items-center gap-1.5 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                        expanded && "rotate-180",
                      )}
                    />
                    <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                      {review.name}
                    </span>
                  </button>
                  <p className="mt-1 font-mono text-sm text-jackals-red-light">
                    {review.vlyNumber}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>{roleLabel(review)}</span>
                    {review.registrationPhotoSubmittedAt ? (
                      <span>
                        {formatSubmittedAt(review.registrationPhotoSubmittedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => void act(review.id, "approve")}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => void act(review.id, "decline")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {expanded ? (
                <div className="mt-3 border-t border-white/10 pt-3">
                  {renderExpanded(review)}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
