import { describe, expect, it } from "vitest";
import {
  parseDatetimeLocalAsClubTime,
  toClubDatetimeLocal,
} from "@/lib/datetime-form";

describe("parseDatetimeLocalAsClubTime", () => {
  it("treats summer Ireland wall time as IST (UTC+1)", () => {
    const date = parseDatetimeLocalAsClubTime("2026-08-08T19:00");
    expect(date.toISOString()).toBe("2026-08-08T18:00:00.000Z");
  });

  it("treats winter Ireland wall time as GMT (UTC+0)", () => {
    const date = parseDatetimeLocalAsClubTime("2026-01-15T19:00");
    expect(date.toISOString()).toBe("2026-01-15T19:00:00.000Z");
  });

  it("round-trips through toClubDatetimeLocal", () => {
    const original = "2026-08-08T19:00";
    const stored = parseDatetimeLocalAsClubTime(original);
    expect(toClubDatetimeLocal(stored.toISOString())).toBe(original);
  });
});
