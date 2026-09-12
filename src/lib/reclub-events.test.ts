import { describe, expect, it } from "vitest";
import { filterFunSessionsWithinCalendarHorizon } from "@/lib/event-filters";
import { formatReclubVenueOrLocation } from "@/lib/reclub-payload";

describe("filterFunSessionsWithinCalendarHorizon", () => {
  const now = new Date("2026-09-12T12:00:00.000Z");

  it("keeps Reclub-synced fun sessions beyond the admin horizon", () => {
    const events = [
      {
        type: "FUN",
        startDate: "2026-10-20T19:00:00.000Z",
        reclubReferenceCode: "ABC123",
      },
      {
        type: "FUN",
        startDate: "2026-10-20T09:00:00.000Z",
        reclubReferenceCode: null,
      },
      {
        type: "TOURNAMENT",
        startDate: "2026-11-01T09:00:00.000Z",
      },
    ];

    const filtered = filterFunSessionsWithinCalendarHorizon(events, 3, now);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((event) => event.type)).toEqual(["FUN", "TOURNAMENT"]);
    expect(filtered[0]?.reclubReferenceCode).toBe("ABC123");
  });
});

describe("formatReclubVenueOrLocation", () => {
  it("prefers venue name from Reclub payloads", () => {
    expect(
      formatReclubVenueOrLocation(
        {
          name: "Lutrellstown Community Center",
          location: {
            address: "Porterstown Road",
            locality: "Fingal",
            country: "IE",
          },
        },
        null,
      ),
    ).toBe("Lutrellstown Community Center");
  });
});
