"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { apiGet, apiPatch } from "@/lib/client-api";

export type RegistrationReviewItem = {
  id: string;
  vlyNumber: string;
  name: string;
  vlyMembershipPhotoUrl: string;
  registrationPhotoSubmittedAt: string | null;
  rosterRole: string;
  trainingTeamKey: string | null;
};

export function RegistrationReviewsManager({
  initialReviews,
}: {
  initialReviews: RegistrationReviewItem[];
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, action: "approve" | "decline") => {
    setLoadingId(id);
    setError(null);

    const result = await apiPatch(
      `/api/admin/registration-reviews/${id}`,
      { action },
      `Failed to ${action} registration.`,
    );

    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setReviews((current) => current.filter((review) => review.id !== id));
    router.refresh();
  };

  const refresh = async () => {
    setError(null);
    const result = await apiGet<{ reviews: RegistrationReviewItem[] }>(
      "/api/admin/registration-reviews",
      "Failed to refresh reviews.",
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReviews(result.data.reviews);
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400/80" />
        <p className="mt-4 font-display text-lg font-semibold text-white">
          No pending registrations
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          New member sign-ups waiting for photo approval will appear here.
        </p>
        <Button type="button" size="sm" variant="outline" className="mt-6" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {reviews.length} registration{reviews.length === 1 ? "" : "s"} awaiting review
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      <FormError message={error} />

      <div className="space-y-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
              <div className="relative mx-auto h-48 w-36 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:mx-0">
                <Image
                  src={review.vlyMembershipPhotoUrl}
                  alt={`VLY membership photo for ${review.name}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-white">
                  {review.name}
                </p>
                <p className="mt-1 font-mono text-sm text-jackals-red-light">
                  {review.vlyNumber}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {review.rosterRole === "COACH" ? "Coach" : "Player"}
                  {review.trainingTeamKey
                    ? ` · ${review.trainingTeamKey.replaceAll("-", " ")}`
                    : ""}
                </p>
                {review.registrationPhotoSubmittedAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Submitted{" "}
                    {new Date(review.registrationPhotoSubmittedAt).toLocaleString("en-GB")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 bg-black/20 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={loadingId === review.id}
                onClick={() => void act(review.id, "decline")}
              >
                Decline
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={loadingId === review.id}
                onClick={() => void act(review.id, "approve")}
              >
                {loadingId === review.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving
                  </>
                ) : (
                  "Approve"
                )}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
