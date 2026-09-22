"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import {
  apiRemoveSpecialOrderProof,
  apiUploadSpecialOrderProof,
} from "@/lib/client-api";
import { specialOrderProofImageUrl } from "@/lib/special-order-payment-access";

export function SpecialOrderProofUpload({
  paymentToken,
  existingProofUrl,
  proofSubmittedAt,
  paymentStatus = "AWAITING",
}: {
  paymentToken: string;
  existingProofUrl?: string | null;
  proofSubmittedAt?: string | null;
  paymentStatus?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (paymentStatus === "PAID") {
    return (
      <div className="mt-6 flex gap-3 border-t border-white/10 pt-6 text-emerald-200">
        <CheckCircle2 className="h-5 w-5" />
        <div>
          <p className="font-semibold">Payment confirmed</p>
          <p className="text-sm text-emerald-200/75">No further action needed.</p>
        </div>
      </div>
    );
  }

  const upload = async () => {
    if (!file) return setError("Choose a screenshot first.");
    setLoading(true);
    setError(null);
    const result = await apiUploadSpecialOrderProof(paymentToken, file);
    setLoading(false);
    if (!result.ok) return setError(result.error);
    setFile(null);
    setPreview(null);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Remove this screenshot?")) return;
    setLoading(true);
    setError(null);
    const result = await apiRemoveSpecialOrderProof(paymentToken);
    setLoading(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  };

  const hasProof = Boolean(existingProofUrl && proofSubmittedAt);
  return (
    <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
      <div>
        <h3 className="font-medium text-white">Upload your payment receipt</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a screenshot from your banking app after making the transfer.
        </p>
      </div>
      <FormError message={error} />
      {hasProof ? (
        <>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="font-semibold text-blue-100">Receipt received</p>
            <p className="mt-1 text-xs text-blue-200/70">
              Submitted {new Date(proofSubmittedAt!).toLocaleString("en-GB")}
            </p>
            <div className="relative mt-3 h-48 overflow-hidden rounded-lg bg-black/30">
              <Image
                src={specialOrderProofImageUrl(existingProofUrl!, paymentToken)}
                alt="Payment receipt"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void remove()}
          >
            Remove screenshot
          </Button>
        </>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setFile(next);
              setPreview(next ? URL.createObjectURL(next) : null);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-zinc-400 transition hover:border-jackals-red/40 hover:bg-jackals-red/5"
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm">
              {file ? file.name : "Choose screenshot"}
            </span>
          </button>
          {preview ? (
            <div className="relative h-40 overflow-hidden rounded-lg bg-black/30">
              <Image
                src={preview}
                alt="Preview"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ) : null}
          <Button
            type="button"
            disabled={loading || !file}
            onClick={() => void upload()}
          >
            {loading ? "Uploading…" : "Submit receipt"}
          </Button>
        </>
      )}
    </div>
  );
}
