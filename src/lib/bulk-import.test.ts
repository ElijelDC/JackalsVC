import { describe, expect, it } from "vitest";
import { planRosterRemovals } from "@/lib/bulk-import-roster-plan";
import { normalizeVlyNumber } from "@/lib/vly-number";

describe("planRosterRemovals", () => {
  it("never removes members without a VLY number", () => {
    const desired = new Set([normalizeVlyNumber("VLY100")]);
    const removals = planRosterRemovals(
      [
        { id: "1", vlyNumber: "VLY100" },
        { id: "2", vlyNumber: null },
        { id: "3", vlyNumber: "   " },
        { id: "4", vlyNumber: "VLY999" },
      ],
      desired,
    );

    expect(removals.map((row) => row.id)).toEqual(["4"]);
  });

  it("keeps every row present in the sheet", () => {
    const desired = new Set([
      normalizeVlyNumber("VLY1"),
      normalizeVlyNumber("VLYC2"),
    ]);
    const removals = planRosterRemovals(
      [
        { id: "a", vlyNumber: "VLY1" },
        { id: "b", vlyNumber: "VLYC2" },
      ],
      desired,
    );
    expect(removals).toEqual([]);
  });
});
