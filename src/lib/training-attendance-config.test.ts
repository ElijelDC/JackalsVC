import { describe, expect, it } from "vitest";
import {
  hasSessionResponseDeadlinePassed,
  resolveCoachAttendanceStatus,
  resolveCoachEventAttendanceStatus,
} from "@/lib/training-attendance-config";

describe("resolveCoachAttendanceStatus", () => {
  const sessionDate = new Date("2026-08-01T19:00:00.000Z");

  it("keeps explicit attending before and after the session", () => {
    expect(
      resolveCoachAttendanceStatus("ATTENDING", sessionDate, sessionDate),
    ).toBe("ATTENDING");
    expect(
      resolveCoachAttendanceStatus(
        "ATTENDING",
        sessionDate,
        new Date("2026-08-02T00:00:00.000Z"),
      ),
    ).toBe("ATTENDING");
  });

  it("keeps explicit can't attend", () => {
    expect(
      resolveCoachAttendanceStatus("NOT_ATTENDING", sessionDate, sessionDate),
    ).toBe("NOT_ATTENDING");
  });

  it("keeps unanswered before the session starts", () => {
    expect(
      resolveCoachAttendanceStatus(
        "UNANSWERED",
        sessionDate,
        new Date("2026-08-01T18:59:59.000Z"),
      ),
    ).toBe("UNANSWERED");
  });

  it("marks unanswered coaches as can't attend once the session starts", () => {
    expect(
      resolveCoachAttendanceStatus("UNANSWERED", sessionDate, sessionDate),
    ).toBe("NOT_ATTENDING");
    expect(
      resolveCoachAttendanceStatus(
        "UNANSWERED",
        sessionDate,
        new Date("2026-08-02T00:00:00.000Z"),
      ),
    ).toBe("NOT_ATTENDING");
  });

  it("does not resolve player statuses from event maps", () => {
    const map = new Map([["event-1", "UNANSWERED" as const]]);

    expect(
      resolveCoachEventAttendanceStatus(
        "event-1",
        map,
        sessionDate,
        false,
        sessionDate,
      ),
    ).toBe("UNANSWERED");
  });
});

describe("hasSessionResponseDeadlinePassed", () => {
  it("is false before start and true at or after start", () => {
    const sessionDate = new Date("2026-08-01T19:00:00.000Z");

    expect(
      hasSessionResponseDeadlinePassed(
        sessionDate,
        new Date("2026-08-01T18:59:59.000Z"),
      ),
    ).toBe(false);
    expect(
      hasSessionResponseDeadlinePassed(sessionDate, sessionDate),
    ).toBe(true);
  });
});
