"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { apiUploadPaymentProof } from "@/lib/client-api";

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);

  const hasSubmittedProof = Boolean(proofSubmittedAt && existingProofUrl);
  const showUploadForm = !hasSubmittedProof || replaceMode || selectedFile;

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
    setReplaceMode(true);
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
    setReplaceMode(false);
    if (inputRef.current) inputRef.current.value = "";
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
      {message && (
        <div className="mt-4 border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {hasSubmittedProof && !showUploadForm && (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-green-400">Screenshot received — awaiting admin verification</p>
          <p className="mt-1 text-xs text-zinc-500">
            Submitted {new Date(proofSubmittedAt!).toLocaleString("en-GB")}
          </p>
          <div className="relative mt-3 h-48 w-full overflow-hidden rounded-md border border-white/10">
            <Image
              src={existingProofUrl!}
              alt="Payment confirmation screenshot"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setReplaceMode(true)}
          >
            Upload a new screenshot
          </Button>
        </div>
      )}

      {showUploadForm && (
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
            disabled={loading || !selectedFile}
            onClick={submitProof}
          >
            {loading ? "Uploading..." : "Submit screenshot"}
          </Button>
        </div>
      )}
    </div>
  );
}
