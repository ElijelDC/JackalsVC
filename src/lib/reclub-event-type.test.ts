import { describe, expect, it } from "vitest";
import { inferReclubEventType } from "@/lib/reclub-event-type";

describe("inferReclubEventType", () => {
  it("classifies fun sessions and sesh titles as FUN", () => {
    expect(
      inferReclubEventType({
        title: "JVC Lutrellstown Fun Session | Thurs 8pm - 10pm",
      }),
    ).toBe("FUN");
    expect(
      inferReclubEventType({
        title: "JVC Intermediate+ Fun Sesh - LutrellstownCC",
      }),
    ).toBe("FUN");
    expect(
      inferReclubEventType({ title: "Thursday Open Play" }),
    ).toBe("FUN");
  });

  it("keeps tournaments, clinics, and socials out of FUN", () => {
    expect(
      inferReclubEventType({
        title: "JVC Rose Cup & Shield - Mixed Tournament",
      }),
    ).toBe("TOURNAMENT");
    expect(
      inferReclubEventType({ title: "Serving Skills Clinic" }),
    ).toBe("SKILLS_CLINIC");
    expect(
      inferReclubEventType({ title: "End of Season Social" }),
    ).toBe("SOCIAL");
  });

  it("prefers an explicit fun-session title over clinic words in notes", () => {
    expect(
      inferReclubEventType({
        title: "JVC Mixed Fun Session",
        description: "Skills workshop tips in the notes",
      }),
    ).toBe("FUN");
  });
});
