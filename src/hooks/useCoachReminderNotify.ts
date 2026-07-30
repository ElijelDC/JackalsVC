import { useState } from "react";
import type {
  CoachReminderStatus,
  CoachUnansweredItemKind,
} from "@/lib/coach-unanswered-config";
import {
  formatCoachReminderSuccessMessage,
  getCoachReminderButtonLabel,
  getCoachReminderCooldownHint,
} from "@/lib/coach-reminder-ui";
import { apiPost } from "@/lib/client-api";

export function useCoachReminderNotify({
  kind,
  targetId,
  initialStatus,
  sendLabel,
}: {
  kind: CoachUnansweredItemKind;
  targetId: string;
  initialStatus: CoachReminderStatus;
  sendLabel: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemLabel = kind === "match" ? "match" : "training session";
  const onCooldown = !status.canSend;
  const cooldownHint = getCoachReminderCooldownHint(status);
  const buttonLabel = getCoachReminderButtonLabel({
    loading,
    canSend: status.canSend,
    sendLabel,
  });
  const inlineNote =
    error ?? successMessage ?? (onCooldown ? cooldownHint : null);

  const notifyPlayers = async () => {
    if (!status.canSend || loading) return;

    setLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const result = await apiPost<{
        notifiedCount?: number;
        deliveredCount: number;
        loggedCount: number;
        cooldown: CoachReminderStatus;
      }>("/api/coach/notify-unanswered", { kind, id: targetId });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setStatus(result.data.cooldown);
      setSuccessMessage(
        formatCoachReminderSuccessMessage({
          deliveredCount: result.data.deliveredCount,
          loggedCount: result.data.loggedCount,
          compact: true,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reminders");
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    confirmOpen,
    setConfirmOpen,
    loading,
    successMessage,
    error,
    notifyPlayers,
    onCooldown,
    cooldownHint,
    buttonLabel,
    inlineNote,
    itemLabel,
  };
}
