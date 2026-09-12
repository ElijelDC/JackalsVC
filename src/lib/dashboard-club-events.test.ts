import { describe, expect, it } from "vitest";
import { DASHBOARD_CLUB_EVENT_TYPES } from "@/lib/dashboard-club-events";

describe("DASHBOARD_CLUB_EVENT_TYPES", () => {
  it("includes FUN so Reclub fun sessions appear on the dashboard", () => {
    expect(DASHBOARD_CLUB_EVENT_TYPES).toContain("FUN");
    expect(DASHBOARD_CLUB_EVENT_TYPES).toEqual([
      "TOURNAMENT",
      "SKILLS_CLINIC",
      "SOCIAL",
      "FUN",
    ]);
  });
});
