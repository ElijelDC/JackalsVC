"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";
import {
  EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY,
  type EventNewsletterSource,
} from "@/lib/event-newsletter-config";
import { cn } from "@/lib/utils";

type NewsletterSubscribeFormProps = {
  source: EventNewsletterSource;
  initialEmail?: string;
  initialSubscribed?: boolean;
  compact?: boolean;
  minimal?: boolean;
  stacked?: boolean;
  onSubscribed?: () => void;
};

export function NewsletterSubscribeForm({
  source,
  initialEmail = "",
  initialSubscribed = false,
  compact = false,
  minimal = false,
  stacked = false,
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
      <div
        className={cn(
          "flex items-start gap-2 rounded-sm border border-green-500/20 bg-green-500/5",
          minimal ? "mt-3 px-3 py-2.5" : compact ? "px-3 py-2.5" : "mt-3 px-4 py-3",
        )}
        role="status"
      >
        <Check
          className={cn(
            "shrink-0 text-green-400",
            minimal ? "mt-0.5 h-3.5 w-3.5" : "h-4 w-4",
          )}
          aria-hidden
        />
        <p className={cn("text-green-400", minimal ? "text-xs leading-relaxed" : "text-sm")}>
          You&apos;re subscribed — we&apos;ll email you when new events go live.
        </p>
      </div>
    );
  }

  if (minimal) {
    return (
      <form onSubmit={(event) => void submit(event)} className="mt-3 space-y-2">
        <div className="flex overflow-hidden rounded-sm border border-white/10 bg-jackals-inset/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-jackals-red/40 focus-within:ring-1 focus-within:ring-jackals-red/20">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email"
            required
            autoComplete="email"
            aria-label="Email for event updates"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:ring-0"
          />
          <Button
            type="submit"
            disabled={loading}
            size="sm"
            className="h-10 shrink-0 rounded-none border-0 border-l border-white/10 px-4 [clip-path:none] hover:scale-100"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Subscribing" />
            ) : (
              "Notify me"
            )}
          </Button>
        </div>
        {success && (
          <p className="text-xs text-green-400">You&apos;re subscribed. Welcome!</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className={compact || stacked ? "space-y-3" : "mt-4 space-y-3"}
    >
      {!compact && !stacked && (
        <p className="text-sm text-zinc-500">
          Fun sessions, tournaments, and skills clinics — opt in to get an email
          when new ones are added.
        </p>
      )}
      <div
        className={
          compact
            ? "flex flex-col gap-2 sm:flex-row"
            : stacked
              ? "flex flex-col gap-3"
              : "space-y-3"
        }
      >
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={compact ? "sm:flex-1" : undefined}
        />
        <Button
          type="submit"
          disabled={loading}
          className={compact ? "shrink-0" : stacked ? "w-full" : "w-full sm:w-auto"}
        >
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
