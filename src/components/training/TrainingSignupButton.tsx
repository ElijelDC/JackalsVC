"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/FormMessage";
import { apiDelete, apiPost } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function TrainingSignupButton({
  eventId,
  initialSignedUp = false,
  size = "sm",
  className,
  dateLabel,
  showStatusBadge = true,
  compact = false,
}: {
  eventId: string;
  initialSignedUp?: boolean;
  size?: "sm" | "md";
  className?: string;
  dateLabel?: string;
  showStatusBadge?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [signedUp, setSignedUp] = useState(initialSignedUp);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleSignup = async () => {
    setLoading(true);
    setMessage(null);

    const result = signedUp
      ? await apiDelete(`/api/event-signups?eventId=${eventId}`, "Failed to cancel")
      : await apiPost("/api/event-signups", { eventId }, "Failed to sign up");

    setLoading(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setSignedUp(!signedUp);
    router.refresh();
  };

  const signUpLabel = compact ? "Sign up" : dateLabel ? `Sign up for ${dateLabel}` : "Sign up";
  const cancelLabel = compact
    ? "Cancel signup"
    : dateLabel
      ? `Cancel ${dateLabel}`
      : "Cancel signup";

  return (
    <div className={cn(compact ? "inline-flex flex-col items-end gap-1" : "space-y-2", className)}>
      {!compact && <AlertBanner message={message} />}
      <div className="flex flex-wrap items-center gap-2">
        {showStatusBadge && signedUp && !compact && (
          <Badge className="border-green-500/30 bg-green-500/10 text-green-400">
            Signed up
          </Badge>
        )}
        <Button
          variant={signedUp ? "outline" : "primary"}
          size={size}
          disabled={loading}
          className={compact ? "min-w-[7.5rem]" : undefined}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleSignup();
          }}
        >
          {loading ? "..." : signedUp ? cancelLabel : signUpLabel}
        </Button>
      </div>
      {compact && message && (
        <p className="max-w-32 text-right text-xs text-red-400">{message}</p>
      )}
    </div>
  );
}
