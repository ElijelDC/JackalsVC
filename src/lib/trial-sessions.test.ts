import { describe, expect, it } from "vitest";
import {
  normalizeTrialSessionEmail,
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
});
