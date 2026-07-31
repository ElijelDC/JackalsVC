import { describe, expect, it } from "vitest";
import {
  TRIAL_SESSION_REMINDER_WINDOW_MS,
  isWithinTrialSessionReminderWindow,
  trialSessionReminderWindowOpensAt,
} from "@/lib/trial-session-reminder-window";

describe("trial session reminder window", () => {
  const startDate = new Date("2026-08-01T19:00:00.000Z");

  it("opens 24 hours before the session", () => {
    expect(trialSessionReminderWindowOpensAt(startDate).toISOString()).toBe(
      new Date(startDate.getTime() - TRIAL_SESSION_REMINDER_WINDOW_MS).toISOString(),
    );
  });

  it("is open within 24 hours of the session start", () => {
    const now = new Date(startDate.getTime() - 60 * 60 * 1000);
    expect(isWithinTrialSessionReminderWindow(startDate, now)).toBe(true);
  });

  it("is closed more than 24 hours before the session", () => {
    const now = new Date(startDate.getTime() - 25 * 60 * 60 * 1000);
    expect(isWithinTrialSessionReminderWindow(startDate, now)).toBe(false);
  });

  it("is closed after the session has started", () => {
    const now = new Date(startDate.getTime() + 60 * 1000);
    expect(isWithinTrialSessionReminderWindow(startDate, now)).toBe(false);
  });
});
