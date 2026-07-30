import { describe, expect, it } from "vitest";
import {
  formatCoachReminderSuccessMessage,
  getCoachReminderButtonLabel,
  getCoachReminderCooldownHint,
} from "@/lib/coach-reminder-ui";

describe("coach reminder ui", () => {
  it("describes when the next reminder is available", () => {
    const nextAvailableAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    expect(
      getCoachReminderCooldownHint({
        canSend: false,
        lastSentAt: new Date().toISOString(),
        nextAvailableAt,
      }),
    ).toContain("Again");
  });

  it("labels the button as sent while on cooldown", () => {
    expect(
      getCoachReminderButtonLabel({
        loading: false,
        canSend: false,
        sendLabel: "Notify",
      }),
    ).toBe("Sent");
  });

  it("formats a compact delivered reminder message", () => {
    expect(
      formatCoachReminderSuccessMessage({
        deliveredCount: 2,
        loggedCount: 0,
        compact: true,
      }),
    ).toBe("Sent to 2 players");
  });
});
