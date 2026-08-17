import { describe, expect, it } from "vitest";
import {
  isTrialSessionPaymentProofExpired,
  isTrialSessionRegistrationOpen,
  normalizeTrialSessionEmail,
  pickLiveTrialSession,
  pickPublicTrialSession,
  slugifyTrialSessionTitle,
  trialSessionPaymentProofExpiryCutoff,
  TRIAL_SESSION_PAYMENT_PROOF_RETENTION_DAYS,
} from "@/lib/trial-session-types";

describe("trial session helpers", () => {
  it("normalizes email addresses", () => {
    expect(normalizeTrialSessionEmail("  Player@Example.COM ")).toBe(
      "player@example.com",
    );
  });

  it("slugifies titles", () => {
    expect(slugifyTrialSessionTitle("Women's D3 Trial — August")).toBe(
      "women-s-d3-trial-august",
    );
  });

  it("picks the live session for a reused slug", () => {
    const past = {
      id: "past",
      startDate: "2026-08-01T18:00:00.000Z",
      endDate: "2026-08-01T20:00:00.000Z",
    };
    const live = {
      id: "live",
      startDate: "2026-08-20T18:00:00.000Z",
      endDate: "2026-08-20T20:00:00.000Z",
    };
    const now = new Date("2026-08-10T12:00:00.000Z");

    expect(pickLiveTrialSession([live, past], now)?.id).toBe("live");
    expect(pickPublicTrialSession([live, past], now)?.id).toBe("live");
  });

  it("falls back to the most recent past session when none are live", () => {
    const older = {
      id: "older",
      startDate: "2026-07-01T18:00:00.000Z",
      endDate: null,
    };
    const newer = {
      id: "newer",
      startDate: "2026-08-01T18:00:00.000Z",
      endDate: null,
    };
    const now = new Date("2026-08-10T12:00:00.000Z");

    expect(pickLiveTrialSession([newer, older], now)).toBeNull();
    expect(pickPublicTrialSession([newer, older], now)?.id).toBe("newer");
  });

  it("closes registration once the session has started or ended", () => {
    const now = new Date("2026-08-10T18:30:00.000Z");
    expect(
      isTrialSessionRegistrationOpen({
        startDate: "2026-08-10T19:00:00.000Z",
        endDate: "2026-08-10T21:00:00.000Z",
        active: true,
      }, now),
    ).toBe(true);
    expect(
      isTrialSessionRegistrationOpen({
        startDate: "2026-08-10T18:00:00.000Z",
        endDate: "2026-08-10T21:00:00.000Z",
        active: true,
      }, now),
    ).toBe(false);
    expect(
      isTrialSessionRegistrationOpen({
        startDate: "2026-08-01T18:00:00.000Z",
        endDate: "2026-08-01T20:00:00.000Z",
        active: true,
      }, now),
    ).toBe(false);
    expect(
      isTrialSessionRegistrationOpen({
        startDate: "2026-08-10T19:00:00.000Z",
        active: false,
      },       now),
    ).toBe(false);
  });

  it("expires one-off session receipts after two weeks", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    const cutoff = trialSessionPaymentProofExpiryCutoff(now);
    expect(TRIAL_SESSION_PAYMENT_PROOF_RETENTION_DAYS).toBe(14);
    expect(cutoff.toISOString()).toBe("2026-08-03T12:00:00.000Z");
    expect(isTrialSessionPaymentProofExpired(new Date("2026-08-03T11:59:00.000Z"), now)).toBe(
      true,
    );
    expect(isTrialSessionPaymentProofExpired(new Date("2026-08-03T12:00:00.000Z"), now)).toBe(
      false,
    );
    expect(isTrialSessionPaymentProofExpired(new Date("2026-08-16T12:00:00.000Z"), now)).toBe(
      false,
    );
  });
});
