"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import {
  apiGet,
  apiPostForm,
  apiRemoveTrialSessionPaymentProof,
} from "@/lib/client-api";

type TrialSessionPaymentProofUploadProps = {
  slug: string;
  proofId: string | null;
  onProofChange: (proofId: string | null) => void;
  disabled?: boolean;
};

type ProofStatus = {
  id: string;
  proofScreenshotUrl: string;
  createdAt: string;
  removable?: boolean;
};

export function TrialSessionPaymentProofUpload({
  slug,
  proofId,
  onProofChange,
  disabled = false,
}: TrialSessionPaymentProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmedProofIdRef = useRef<string | null>(null);
  const [uploadedProof, setUploadedProof] = useState<ProofStatus | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [checkingProof, setCheckingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!proofId) {
      setUploadedProof(null);
      setCheckingProof(false);
      confirmedProofIdRef.current = null;
      return;
    }

    if (confirmedProofIdRef.current === proofId) {
      setCheckingProof(false);
      return;
    }

    let cancelled = false;
    setCheckingProof(true);

    void apiGet<ProofStatus>(
      `/api/trial-sessions/${slug}/payment-proof?proofId=${encodeURIComponent(proofId)}`,
      "Could not load payment receipt",
    ).then((result) => {
      if (cancelled) return;
      setCheckingProof(false);

      if (result.ok) {
        confirmedProofIdRef.current = proofId;
        setUploadedProof(result.data);
        setError(null);
        return;
      }

      confirmedProofIdRef.current = null;
      setUploadedProof(null);
      setError(result.error);
      onProofChange(null);
    });

    return () => {
      cancelled = true;
    };
  }, [onProofChange, proofId, slug]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setMessage(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submitProof = async () => {
    if (!selectedFile) {
      setError("Choose a screenshot of your payment confirmation first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("screenshot", selectedFile);

    const result = await apiPostForm<{
      proof: ProofStatus;
      message: string;
    }>(
      `/api/trial-sessions/${slug}/payment-proof`,
      formData,
      "Could not upload payment receipt",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    confirmedProofIdRef.current = result.data.proof.id;
    setUploadedProof(result.data.proof);
    onProofChange(result.data.proof.id);
    setMessage(result.data.message);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeProof = async () => {
    if (!proofId) return;

    setRemoving(true);
    setError(null);
    setMessage(null);

    const result = await apiRemoveTrialSessionPaymentProof(slug, proofId);

    setRemoving(false);

    if (!result.ok) {
      if (result.error.toLowerCase().includes("not found")) {
        confirmedProofIdRef.current = null;
        setUploadedProof(null);
        onProofChange(null);
      }
      setError(result.error);
      return;
    }

    setUploadedProof(null);
    confirmedProofIdRef.current = null;
    onProofChange(null);
    setMessage(result.data.message);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (checkingProof) {
    return <p className="text-sm text-zinc-500">Checking payment receipt…</p>;
  }

  if (uploadedProof) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium text-green-200">Payment receipt uploaded</p>
              <p className="mt-1 text-green-300/80">
                You can now register with your email and name below.
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-48 w-full overflow-hidden rounded-md border border-white/10">
          <Image
            src={uploadedProof.proofScreenshotUrl}
            alt="Payment receipt"
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        <FormError message={error} />
        {message ? <p className="text-sm text-green-300">{message}</p> : null}

        {uploadedProof.removable !== false ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled || removing}
            onClick={() => void removeProof()}
          >
            {removing ? "Removing..." : "Remove and upload a different receipt"}
          </Button>
        ) : (
          <p className="text-sm text-zinc-500">
            This receipt is linked to your request and cannot be replaced here.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        After paying, upload a screenshot of your payment confirmation. You
        can register once this is uploaded.
      </p>

      <FormError message={error} />
      {message ? <p className="text-sm text-green-300">{message}</p> : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload className="mb-2 h-8 w-8 text-zinc-500" />
        <span className="text-sm font-medium text-white">
          {selectedFile ? selectedFile.name : "Choose payment receipt"}
        </span>
        <span className="mt-1 text-xs text-zinc-500">
          JPEG, PNG, WebP, GIF, or HEIC · max 5 MB
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={handleFileChange}
      />

      {previewUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-md border border-white/10">
          <Image
            src={previewUrl}
            alt="Receipt preview"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        disabled={disabled || loading}
        onClick={() => void submitProof()}
      >
        {loading ? "Uploading..." : "Upload receipt"}
      </Button>
    </div>
  );
}
