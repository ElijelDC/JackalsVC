"use client";

import { Modal } from "@/components/ui/Modal";

type OfferSignatureModalProps = {
  open: boolean;
  onClose: () => void;
  fullName: string;
  signatureDataUrl: string;
};

export function OfferSignatureModal({
  open,
  onClose,
  fullName,
  signatureDataUrl,
}: OfferSignatureModalProps) {
  const hasImage = signatureDataUrl.startsWith("data:image/");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Signature"
      description={
        <p className="text-sm leading-relaxed text-zinc-400">
          Signed by <span className="text-zinc-200">{fullName}</span>
        </p>
      }
      className="max-w-[min(100%,32rem)]"
    >
      {hasImage ? (
        <div className="rounded-lg border border-white/10 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureDataUrl}
            alt={`Signature from ${fullName}`}
            className="mx-auto h-auto max-h-[50vh] w-full object-contain"
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No signature on file.</p>
      )}
    </Modal>
  );
}
