"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiPatch } from "@/lib/client-api";

export function ProfileNewsletterSection({
  initialOptOut,
}: {
  initialOptOut: boolean;
}) {
  const [subscribed, setSubscribed] = useState(!initialOptOut);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggle = async () => {
    const next = !subscribed;
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await apiPatch<{ eventNewsletterOptOut: boolean }>(
      "/api/profile/newsletter",
      { optOut: !next },
      "Failed to update event email preference.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubscribed(!result.data.eventNewsletterOptOut);
    setSaved(true);
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <h2 className="font-display text-lg font-semibold text-white">
        Event emails
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Get an email when the club adds a new tournament, clinic, or social.
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm text-zinc-300">
          {subscribed ? "Subscribed to event emails" : "Event emails turned off"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={subscribed}
          aria-label="Toggle event emails"
          disabled={loading}
          onClick={() => void toggle()}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            subscribed ? "bg-jackals-red" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              subscribed ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
          {loading && (
            <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
          )}
        </button>
      </div>

      {saved && (
        <p className="mt-2 text-sm text-green-400">Preference saved.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
