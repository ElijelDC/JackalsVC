export const EVENT_NEWSLETTER_OVERLAY_SNOOZE_DAYS = 7;
export const EVENT_NEWSLETTER_OVERLAY_STORAGE_KEY =
  "jackals-event-newsletter-overlay-snooze";
export const EVENT_NEWSLETTER_SUBSCRIBED_STORAGE_KEY =
  "jackals-event-newsletter-subscribed";

export const EVENT_NEWSLETTER_SOURCES = [
  "homepage",
  "footer",
  "profile",
] as const;

export type EventNewsletterSource =
  (typeof EVENT_NEWSLETTER_SOURCES)[number];
