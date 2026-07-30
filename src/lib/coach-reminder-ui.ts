import { formatDistanceToNow } from "date-fns";
import type { CoachReminderStatus } from "@/lib/coach-unanswered-config";

/** Short hint for inline display beside the notify button. */
export function getCoachReminderCooldownHint(
  status: CoachReminderStatus,
): string | null {
  if (status.canSend) return null;

  if (status.nextAvailableAt) {
    return `Again ${formatDistanceToNow(new Date(status.nextAvailableAt), { addSuffix: true })}`;
  }

  return "24h cooldown";
}

export function getCoachReminderButtonLabel(options: {
  loading: boolean;
  canSend: boolean;
  sendLabel: string;
}): string {
  if (options.loading) return "Sending...";
  if (!options.canSend) return "Sent";
  return options.sendLabel;
}

export function formatCoachReminderSuccessMessage(options: {
  deliveredCount: number;
  loggedCount: number;
  compact?: boolean;
}): string {
  if (options.deliveredCount > 0) {
    if (options.compact) {
      return `Sent to ${options.deliveredCount} player${options.deliveredCount === 1 ? "" : "s"}`;
    }
    return `Reminder sent to ${options.deliveredCount} player${options.deliveredCount === 1 ? "" : "s"}.`;
  }

  if (options.loggedCount > 0) {
    if (options.compact) {
      return `${options.loggedCount} logged to console`;
    }
    return `Email is not configured — ${options.loggedCount} reminder${options.loggedCount === 1 ? "" : "s"} logged to the server console.`;
  }

  return options.compact ? "No reminders needed" : "No players needed a reminder.";
}
