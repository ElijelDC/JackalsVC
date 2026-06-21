"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiDelete, apiPost } from "@/lib/client-api";

export function EventReminderButton({
  eventId,
  initialHasReminder,
  compact = false,
  onChange,
}: {
  eventId: string;
  initialHasReminder: boolean;
  compact?: boolean;
  onChange?: (hasReminder: boolean) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [hasReminder, setHasReminder] = useState(initialHasReminder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHasReminder(initialHasReminder);
  }, [initialHasReminder]);

  const toggleReminder = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/calendar/${eventId}`);
      return;
    }

    setLoading(true);

    if (hasReminder) {
      const result = await apiDelete(`/api/reminders?eventId=${eventId}`);
      if (result.ok) {
        setHasReminder(false);
        onChange?.(false);
      }
    } else {
      const result = await apiPost("/api/reminders", { eventId });
      if (result.ok) {
        setHasReminder(true);
        onChange?.(true);
      }
    }

    setLoading(false);
  };

  if (compact) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          toggleReminder();
        }}
        title={hasReminder ? "Remove club reminder" : "Save club reminder"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-jackals-red-light disabled:opacity-50"
      >
        {hasReminder ? (
          <BellOff className="h-4 w-4 text-jackals-red-light" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={toggleReminder}
      className="w-full"
    >
      {hasReminder ? (
        <>
          <BellOff className="h-4 w-4" />
          Remove club reminder
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Save club reminder
        </>
      )}
    </Button>
  );
}
