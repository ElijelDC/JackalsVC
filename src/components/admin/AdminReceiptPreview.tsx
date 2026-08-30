"use client";

import { useState } from "react";
import { CheckCircle2, Expand, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export function AdminReceiptPreview({
  name,
  email,
  amountLabel,
  proofUrl,
  canApprove,
  approving,
  onApprove,
  compact = false,
}: {
  name: string;
  email: string;
  amountLabel: string;
  proofUrl: string | null;
  canApprove: boolean;
  approving: boolean;
  onApprove: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        {proofUrl ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative block w-full overflow-hidden rounded-lg border border-white/15 bg-black/40 text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofUrl}
              alt={`Payment receipt from ${name}`}
              className={cn(
                "w-full bg-zinc-950 object-contain",
                compact ? "h-28" : "max-h-72",
              )}
            />
            <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-black/75 px-2 py-1 text-[11px] font-medium text-white">
              <Expand className="h-3 w-3" /> View full size
            </span>
          </button>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-zinc-500">
            No receipt uploaded yet.
          </p>
        )}
        {canApprove ? (
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={approving}
            onClick={onApprove}
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Approve payment
              </>
            )}
          </Button>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Receipt · ${name}`}
        description={
          <p className="text-sm text-zinc-400">
            {email} · {amountLabel}
          </p>
        }
        className="max-w-[min(100%,44rem)]"
      >
        <div className="space-y-4">
          {proofUrl ? (
            <a href={proofUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofUrl}
                alt={`Payment receipt from ${name}`}
                className="max-h-[70vh] w-full rounded-lg border border-white/10 object-contain bg-black"
              />
            </a>
          ) : null}
          {canApprove ? (
            <Button
              type="button"
              className={cn("w-full")}
              disabled={approving}
              onClick={() => {
                onApprove();
                setOpen(false);
              }}
            >
              {approving ? "Approving…" : "Approve payment"}
            </Button>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
