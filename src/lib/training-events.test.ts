import { describe, expect, it } from "vitest";
import { buildTrainingOccurrences } from "@/lib/training-events";
import type { TrainingSession } from "@/generated/prisma/client";

function weeklySession(
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id: "session-1",
    category: "WEEKLY",
    trainingTeamKey: "DIV2_MENS",
    title: "D2M Training",
    dayOfWeek: 2,
    startTime: "19:00",
    endTime: "21:00",
    location: "Meakstown",
    level: "",
    coach: null,
    description: null,
    recurring: true,
    recurrenceWeeks: 1,
    recurringFrom: new Date("2026-08-01T00:00:00.000Z"),
    recurringTo: new Date("2026-08-31T23:59:59.999Z"),
    sessionDate: null,
    attendanceUrl: null,
    paymentUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("buildTrainingOccurrences", () => {
  it("stores summer Ireland wall times as correct UTC instants", () => {
    const occurrences = buildTrainingOccurrences(weeklySession());
    const first = occurrences[0];

    expect(first).toBeDefined();
    expect(first!.startDate.toISOString()).toBe("2026-08-04T18:00:00.000Z");
    expect(first!.endDate.toISOString()).toBe("2026-08-04T20:00:00.000Z");
  });
});
