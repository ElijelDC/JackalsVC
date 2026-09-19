"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormMessage";
import { apiPostForm } from "@/lib/client-api";
import type { StudentIdReviewStatus } from "@/lib/student-id-proof";

export function StudentIdStatusCard({
  reviewStatus,
  proofUrl,
  reviewNote,
}: {
  reviewStatus: StudentIdReviewStatus | string | null;
  proofUrl: string | null;
  reviewNote: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reviewStatus) return null;

  const needsUpload =
    reviewStatus === "AWAITING_PROOF" ||
    reviewStatus === "DECLINED" ||
    (reviewStatus === "PENDING" && !proofUrl);

  const canReplacePending = reviewStatus === "PENDING" && Boolean(proofUrl);

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("studentIdProof", file);
    const result = await apiPostForm(
      "/api/membership/student-id-proof",
      form,
      "Could not upload student ID",
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <Card className="mb-6 border-amber-500/20 bg-amber-500/[0.04]">
      <CardTitle className="text-base">Student / U18 ID</CardTitle>
      <CardDescription className="mt-2">
        {reviewStatus === "AWAITING_PROOF" ||
        (reviewStatus === "PENDING" && !proofUrl)
          ? "Upload a clear photo of your student card or under-18 ID to confirm your Student/U18 rate."
          : reviewStatus === "PENDING"
            ? "Your ID is with the club for review. You can keep paying while we check it."
            : reviewStatus === "APPROVED"
              ? "Your Student/U18 rate is confirmed."
              : "Your ID was not approved. Upload a clearer student card or under-18 ID."}
      </CardDescription>

      <div className="mt-4 flex items-center gap-2 text-sm">
        {reviewStatus === "AWAITING_PROOF" ||
        (reviewStatus === "PENDING" && !proofUrl) ? (
          <>
            <Upload className="h-4 w-4 text-amber-300" />
            <span className="text-amber-100">ID upload required</span>
          </>
        ) : null}
        {reviewStatus === "PENDING" && proofUrl ? (
          <>
            <Clock3 className="h-4 w-4 text-amber-300" />
            <span className="text-amber-100">Awaiting admin approval</span>
          </>
        ) : null}
        {reviewStatus === "APPROVED" ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-200">Approved</span>
          </>
        ) : null}
        {reviewStatus === "DECLINED" ? (
          <>
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-200">Declined</span>
          </>
        ) : null}
      </div>

      {reviewNote ? (
        <p className="mt-3 text-sm text-zinc-400">Club note: {reviewNote}</p>
      ) : null}

      {proofUrl && reviewStatus !== "DECLINED" && reviewStatus !== "AWAITING_PROOF" ? (
        <p className="mt-3 text-xs text-zinc-500">ID photo on file with the club.</p>
      ) : null}

      {(needsUpload || canReplacePending) && (
        <div className="mt-4 space-y-3">
          <FormError message={error} />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant={needsUpload ? "primary" : "outline"}
            disabled={loading}
            className="gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {loading
              ? "Uploading..."
              : reviewStatus === "DECLINED"
                ? "Upload a new ID"
                : needsUpload
                  ? "Upload student / U18 ID"
                  : "Replace ID photo"}
          </Button>
        </div>
      )}
    </Card>
  );
}
