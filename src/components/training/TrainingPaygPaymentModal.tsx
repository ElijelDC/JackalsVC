"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Modal } from "@/components/ui/Modal";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import { apiPost, apiPostForm } from "@/lib/client-api";
import { compressImageFileForUpload } from "@/lib/client-image-compress";
import type { TrainingPaygAttendanceRecord } from "@/lib/player-payment-type";
import { TRAINING_PAYG_ATTENDANCE_STATUS_LABELS } from "@/lib/player-payment-type";
import type { ClubBankDetails } from "@/lib/payments";

type EnsureResponse = {
  attendance: TrainingPaygAttendanceRecord;
  bank: ClubBankDetails;
  paymentUrl: string;
  alreadyApproved: boolean;
};

type ProofResponse = {
  attendance: TrainingPaygAttendanceRecord;
  autoApproved: boolean;
  message: string;
};

export function TrainingPaygPaymentModal({
  open,
  eventId,
  onClose,
  onApproved,
}: {
  open: boolean;
  eventId: string;
  onClose: () => void;
  onApproved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attendance, setAttendance] =
    useState<TrainingPaygAttendanceRecord | null>(null);
  const [bank, setBank] = useState<ClubBankDetails | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessage(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    void apiPost<EnsureResponse>(
      "/api/training-payg/attendances",
      { eventId },
      "Could not start Pay Per Training payment",
    ).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.alreadyApproved) {
        onApproved();
        onClose();
        return;
      }
      setAttendance(result.data.attendance);
      setBank(result.data.bank);
      setPaymentUrl(result.data.paymentUrl);
    });

    return () => {
      cancelled = true;
    };
    // Intentionally only re-run when the modal opens for an event.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onApproved/onClose are unstable
  }, [open, eventId]);

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
    if (!attendance || !selectedFile) {
      setError("Choose a screenshot of your payment confirmation first.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    let screenshot = selectedFile;
    try {
      screenshot = await compressImageFileForUpload(selectedFile, "receipt");
    } catch {
      screenshot = selectedFile;
    }

    const formData = new FormData();
    formData.append("screenshot", screenshot);

    const result = await apiPostForm<ProofResponse>(
      `/api/training-payg/attendances/${attendance.id}/proof`,
      formData,
      "Could not upload payment receipt",
    );

    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setAttendance(result.data.attendance);
    setMessage(result.data.message);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";

    if (result.data.attendance.status === "APPROVED") {
      onApproved();
      onClose();
    }
  };

  const pendingReview = attendance?.status === "PENDING";
  const awaitingProof =
    attendance?.status === "AWAITING_PROOF" ||
    attendance?.status === "REJECTED";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pay for this training"
      description={
        <p className="text-sm text-zinc-400">
          Pay Per Training — pay the session fee and upload a receipt before you
          can mark attending.
        </p>
      }
      className="max-w-lg"
    >
      {loading ? (
        <p className="text-sm text-zinc-400">Loading payment details…</p>
      ) : (
        <div className="space-y-4">
          <FormError message={error} />
          {message && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-200">
              {message}
            </div>
          )}

          {attendance && bank && (
            <IbanTransferDetails
              accountHolder={bank.accountHolder}
              iban={bank.iban}
              accountLabel={bank.accountLabel}
              paymentReference={attendance.paymentReference}
              amount={attendance.amountDue}
            />
          )}

          {paymentUrl ? (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-jackals-red-light hover:text-jackals-red"
            >
              Open payment link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}

          {pendingReview && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {
                      TRAINING_PAYG_ATTENDANCE_STATUS_LABELS[
                        attendance?.status ?? "PENDING"
                      ]
                    }
                  </p>
                  <p className="mt-1 text-amber-100/80">
                    Your receipt is with the club for review. You&apos;ll get an
                    email when you&apos;re approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {awaitingProof && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">
                After you pay, upload a screenshot of the confirmation showing
                the amount.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
              />
              {previewUrl && (
                <div className="relative h-40 overflow-hidden rounded-lg border border-white/10 bg-black/30">
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
                onClick={() => void submitProof()}
                disabled={uploading || !selectedFile}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload receipt"}
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
}
