"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { NewsletterSubscribeForm } from "@/components/newsletter/NewsletterSubscribeForm";
import {
  EVENT_NEWSLETTER_OVERLAY_SNOOZE_DAYS,
  EVENT_NEWSLETTER_OVERLAY_STORAGE_KEY,
  EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY,
} from "@/lib/event-newsletter-config";

export function NewsletterHomeOverlay({
  initialSubscribed = false,
  userEmail = "",
}: {
  initialSubscribed?: boolean;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (initialSubscribed) return;
    if (localStorage.getItem(EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY) === "true") {
      return;
    }

    const snoozeRaw = localStorage.getItem(EVENT_NEWSLETTER_OVERLAY_STORAGE_KEY);
    if (snoozeRaw) {
      const snoozedAt = Number(snoozeRaw);
      const snoozeMs = EVENT_NEWSLETTER_OVERLAY_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
      if (!Number.isNaN(snoozedAt) && Date.now() - snoozedAt < snoozeMs) {
        return;
      }
    }

    const timer = window.setTimeout(() => setOpen(true), 2500);
    return () => window.clearTimeout(timer);
  }, [initialSubscribed]);

  const dismiss = () => {
    localStorage.setItem(
      EVENT_NEWSLETTER_OVERLAY_STORAGE_KEY,
      String(Date.now()),
    );
    setOpen(false);
  };

  const handleSubscribed = () => {
    localStorage.setItem(EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={dismiss}
      title="Stay in the loop"
      description={
        <p className="text-sm text-zinc-400">
          Subscribe for emails about fun sessions, tournaments, and skills
          clinics. Members and guests welcome — opt in only.
        </p>
      }
    >
      <NewsletterSubscribeForm
        source="homepage"
        initialEmail={userEmail}
        initialSubscribed={initialSubscribed}
        onSubscribed={handleSubscribed}
      />
      <button
        type="button"
        onClick={dismiss}
        className="mt-4 w-full text-center text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Not now
      </button>
    </Modal>
  );
}
