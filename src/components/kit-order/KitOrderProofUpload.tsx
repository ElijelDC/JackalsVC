"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import {
  apiRemoveKitOrderProof,
  apiUploadKitOrderProof,
} from "@/lib/client-api";
import { kitOrderProofImageUrl } from "@/lib/kit-order-payment-access";

type KitOrderProofUploadProps = {
  paymentToken: string;
  existingProofUrl?: string | null;
  proofSubmittedAt?: string | null;
  paymentStatus?: string;
};

export function KitOrderProofUpload({
  paymentToken,
  existingProofUrl,
  proofSubmittedAt,
  paymentStatus = "AWAITING",
}: KitOrderProofUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPaid = paymentStatus === "PAID";
  const isPendingVerification = Boolean(
    !isPaid && proofSubmittedAt && existingProofUrl,
  );

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

    const result = await apiUploadKitOrderProof(paymentToken, selectedFile);

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

    const result = await apiRemoveKitOrderProof(paymentToken);

    setRemoving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(result.data.message);
    router.refresh();
  };

  if (isPaid) {
    return (
      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="font-semibold text-green-100">Payment confirmed</p>
            <p className="mt-1 text-sm text-green-200/80">
              The club has marked your kit order as paid. No further action needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h3 className="font-medium text-white">Upload your payment receipt</h3>
      <p className="mt-1 text-sm text-zinc-400">
        After paying by bank transfer, upload a screenshot from your banking app.
        We&apos;ll match it to your order and confirm by email.
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
                <p className="font-semibold text-blue-100">Receipt received</p>
                <p className="mt-1 text-sm leading-relaxed text-blue-200/80">
                  Thanks — we&apos;ll verify your transfer and be in touch if
                  anything is missing.
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
                src={kitOrderProofImageUrl(existingProofUrl!, paymentToken)}
                alt="Payment receipt screenshot"
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
                <UploadArea
                  inputRef={inputRef}
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onFileChange={handleFileChange}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
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
                    {loading ? "Uploading…" : "Submit replacement"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={startReplaceProof}
                >
                  Change screenshot
                </Button>
                <button
                  type="button"
                  onClick={removeProof}
                  disabled={removing}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:border-red-500/60 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {removing ? "Removing…" : "Remove screenshot"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <UploadArea
            inputRef={inputRef}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
          />
          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={submitProof}
          >
            {loading ? "Uploading…" : "Submit receipt"}
          </Button>
        </div>
      )}
    </div>
  );
}

function UploadArea({
  inputRef,
  selectedFile,
  previewUrl,
  onFileChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  previewUrl: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5"
      >
        <Upload className="mb-2 h-8 w-8 text-zinc-500" />
        <span className="text-sm font-medium text-white">
          {selectedFile ? selectedFile.name : "Choose payment screenshot"}
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
        onChange={onFileChange}
      />
      {previewUrl ? (
        <div className="relative h-48 w-full overflow-hidden rounded-md border border-white/10">
          <Image
            src={previewUrl}
            alt="Screenshot preview"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : null}
    </>
  );
}
