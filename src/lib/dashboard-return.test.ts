import { describe, expect, it } from "vitest";
import {
  appendReturnFrom,
  buildScheduleListHref,
  isDashboardReturn,
  resolveDetailBackLink,
  withDashboardReturn,
} from "./dashboard-return";

describe("dashboard-return", () => {
  it("marks dashboard return links", () => {
    expect(withDashboardReturn("/training/session/abc")).toBe(
      "/training/session/abc?from=dashboard",
    );
    expect(withDashboardReturn("/matches?month=2026-08")).toBe(
      "/matches?month=2026-08&from=dashboard",
    );
  });

  it("resolves detail back link to dashboard when requested", () => {
    expect(
      resolveDetailBackLink("dashboard", {
        path: "/training?month=2026-08",
        label: "Division 2 Mens",
      }),
    ).toEqual({ path: "/dashboard", label: "Dashboard" });
  });

  it("keeps schedule fallback when not from dashboard", () => {
    expect(
      resolveDetailBackLink(undefined, {
        path: "/matches?month=2026-08",
        label: "Division 2 Mens",
      }),
    ).toEqual({ path: "/matches?month=2026-08", label: "Division 2 Mens" });
  });

  it("builds schedule list links with optional filters", () => {
    expect(buildScheduleListHref("/training")).toBe("/training");
    expect(
      buildScheduleListHref("/matches", {
        month: "2026-08",
        team: "d2-mens",
        from: "dashboard",
      }),
    ).toBe("/matches?month=2026-08&team=d2-mens&from=dashboard");
  });

  it("appends return param only for dashboard flow", () => {
    expect(appendReturnFrom("/matches/1", "dashboard")).toBe("/matches/1?from=dashboard");
    expect(appendReturnFrom("/matches/1", undefined)).toBe("/matches/1");
    expect(isDashboardReturn("dashboard")).toBe(true);
  });
});
