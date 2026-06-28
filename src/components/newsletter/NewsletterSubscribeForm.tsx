"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";
import {
  EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY,
  type EventNewsletterSource,
} from "@/lib/event-newsletter-config";

type NewsletterSubscribeFormProps = {
  source: EventNewsletterSource;
  initialEmail?: string;
  initialSubscribed?: boolean;
  compact?: boolean;
  onSubscribed?: () => void;
};

export function NewsletterSubscribeForm({
  source,
  initialEmail = "",
  initialSubscribed = false,
  compact = false,
  onSubscribed,
}: NewsletterSubscribeFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await apiPost<{ subscribed: boolean; email: string }>(
      "/api/newsletter/subscribe",
      { email, source },
      "Failed to subscribe. Please try again.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubscribed(true);
    setSuccess(true);
    localStorage.setItem(EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY, "true");
    onSubscribed?.();
  };

  if (subscribed) {
    return (
      <p className={compact ? "text-sm text-green-400" : "mt-3 text-sm text-green-400"}>
        You&apos;re subscribed to event emails.
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className={compact ? "space-y-3" : "mt-4 space-y-3"}>
      {!compact && (
        <p className="text-sm text-zinc-500">
          Fun sessions, tournaments, and skills clinics — opt in to get an email
          when new ones are added.
        </p>
      )}
      <div className={compact ? "flex flex-col gap-2 sm:flex-row" : "space-y-3"}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={compact ? "sm:flex-1" : undefined}
        />
        <Button type="submit" disabled={loading} className={compact ? "shrink-0" : "w-full sm:w-auto"}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing…
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </div>
      {success && (
        <p className="text-sm text-green-400">You&apos;re subscribed. Welcome!</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
