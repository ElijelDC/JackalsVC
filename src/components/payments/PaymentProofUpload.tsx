"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { apiRemovePaymentProof, apiUploadPaymentProof } from "@/lib/client-api";

type PaymentProofUploadProps = {
  paymentId: string;
  existingProofUrl?: string | null;
  proofSubmittedAt?: string | null;
};

export function PaymentProofUpload({
  paymentId,
  existingProofUrl,
  proofSubmittedAt,
}: PaymentProofUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPendingVerification = Boolean(proofSubmittedAt && existingProofUrl);

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
      setError("Please choose a screenshot of your bank transfer first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiUploadPaymentProof(paymentId, selectedFile);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(result.data.message);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsReplacing(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  const startReplaceProof = () => {
    setIsReplacing(true);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const cancelReplaceProof = () => {
    setIsReplacing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeProof = async () => {
    if (
      !confirm(
        "Remove this screenshot? You can upload a new one if you need to replace it.",
      )
    ) {
      return;
    }

    setRemoving(true);
    setError(null);
    setMessage(null);

    const result = await apiRemovePaymentProof(paymentId);

    setRemoving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(result.data.message);
    router.refresh();
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h3 className="font-medium text-white">Confirm your payment</h3>
      <p className="mt-1 text-sm text-zinc-400">
        After paying by bank transfer, upload a screenshot of the confirmation from your banking
        app. A club admin will verify it against the bank statement.
      </p>

      <FormError message={error} />
      {message && !isPendingVerification && (
        <div className="mt-4 border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {isPendingVerification ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-blue-500/35 bg-blue-500/10">
          <div className="border-b border-blue-500/20 bg-blue-500/10 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <Clock3 className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="font-semibold text-blue-100">Screenshot submitted</p>
                <p className="mt-1 text-sm leading-relaxed text-blue-200/80">
                  A club admin will verify your bank transfer against the statement. You
                  don&apos;t need to do anything else for now.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-300/70">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Submitted {new Date(proofSubmittedAt!).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="relative h-48 w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
              <Image
                src={existingProofUrl!}
                alt="Payment confirmation screenshot"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {isReplacing ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-zinc-400">
                  Choose a new screenshot to replace the current one.
                </p>

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5"
                >
                  <Upload className="mb-2 h-8 w-8 text-zinc-500" />
                  <span className="text-sm font-medium text-white">
                    {selectedFile ? selectedFile.name : "Choose replacement screenshot"}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    JPEG, PNG or WebP · max 5 MB
                  </span>
                </button>

                {previewUrl && (
                  <div className="relative h-48 w-full overflow-hidden rounded-md border border-white/10">
                    <Image
                      src={previewUrl}
                      alt="Replacement screenshot preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 gap-1.5"
                    onClick={cancelReplaceProof}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={loading}
                    onClick={submitProof}
                  >
                    {loading ? "Uploading..." : "Submit replacement"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={startReplaceProof}
                >
                  Change screenshot
                </Button>

                <button
                  type="button"
                  onClick={removeProof}
                  disabled={removing}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:border-red-500/60 hover:bg-red-500/20 hover:text-red-100 disabled:opacity-50"
                >
                  {removing ? "Removing..." : "Remove screenshot"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5"
          >
            <Upload className="mb-2 h-8 w-8 text-zinc-500" />
            <span className="text-sm font-medium text-white">
              {selectedFile ? selectedFile.name : "Choose payment screenshot"}
            </span>
            <span className="mt-1 text-xs text-zinc-500">JPEG, PNG or WebP · max 5 MB</span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl && (
            <div className="relative h-48 w-full overflow-hidden rounded-md border border-white/10">
              <Image
                src={previewUrl}
                alt="Screenshot preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={submitProof}
          >
            {loading ? "Uploading..." : "Submit screenshot"}
          </Button>
        </div>
      )}
    </div>
  );
}
