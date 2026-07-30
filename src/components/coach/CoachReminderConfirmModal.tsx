"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function CoachReminderConfirmModal({
  open,
  onClose,
  loading,
  onCooldown,
  playerCount,
  itemLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onCooldown: boolean;
  playerCount: number;
  itemLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Send reminder?"
      description={
        <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
          Email {playerCount} unanswered player
          {playerCount === 1 ? "" : "s"} asking them to respond to this{" "}
          {itemLabel}?
        </p>
      }
    >
      <Button
        type="button"
        onClick={onConfirm}
        disabled={loading || onCooldown}
        className="h-12 w-full gap-2 text-base"
      >
        <Bell className="h-4 w-4" />
        {loading ? "Sending..." : "Send reminder"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={loading}
        className="h-12 w-full text-base"
      >
        Cancel
      </Button>
    </Modal>
  );
}
