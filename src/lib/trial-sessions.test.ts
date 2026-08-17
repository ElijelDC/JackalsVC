import { describe, expect, it } from "vitest";
import {
  normalizeTrialSessionEmail,
  pickLiveTrialSession,
  pickPublicTrialSession,
  slugifyTrialSessionTitle,
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
});
