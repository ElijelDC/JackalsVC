import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, beforeAll } from "vitest";
import { resolveDayPlan, weekDayPlans } from "@/lib/setter-season/plan-resolver";
import { validatePlanBundle } from "@/lib/setter-season/validate";
import type { MasterPlan, TrainingCalendar } from "@/lib/setter-season/types";

const AGENT = path.join(process.cwd(), "public/agent");

let plan: MasterPlan;
let calendar: TrainingCalendar;

beforeAll(() => {
  plan = JSON.parse(
    readFileSync(path.join(AGENT, "setter-season-workout-plan.json"), "utf8"),
  ) as MasterPlan;
  calendar = JSON.parse(
    readFileSync(path.join(AGENT, "d2m-fixtures-training-calendar.json"),
      "utf8",
    ),
  ) as TrainingCalendar;
});

describe("setter season bundle", () => {
  it("validates import checklist", () => {
    expect(validatePlanBundle(plan, calendar)).toEqual([]);
    expect(plan.meta.version).toBe("2026-09-27-f");
    expect(calendar.trainingCalendarByWeek.length).toBe(29);
    expect(calendar.trainingCalendarByWeek.filter((w) => w.d2mMatch).length).toBe(
      14,
    );
  });

  it("week 2026-10-05 Sunday is MD1 match day", () => {
    const day = resolveDayPlan(plan, calendar, "2026-10-11");
    expect(day.sessionId).toBe("sun-match-day");
    expect(day.match?.opponent).toBe("BMP Titans");
    expect(day.match?.kickOff).toBe("13:00");
  });

  it("bye week Monday is full leg A session", () => {
    const byeWeek = calendar.trainingCalendarByWeek.find(
      (w) => w.weekStarting === "2026-09-28",
    );
    expect(byeWeek?.d2mMatch).toBeNull();
    const monday = weekDayPlans(plan, calendar, "2026-09-28")[0];
    expect(monday.sessionId).toBe("mon-leg-a-push-plyo");
  });

  it("Thursday is always pull / no legs", () => {
    for (const week of calendar.trainingCalendarByWeek) {
      const thu = week.sessionIds.thursday;
      expect(thu).toBe("thu-pull-core");
      const session = plan.sessions[thu];
      expect(session.noLegs).toBe(true);
    }
  });

  it("filters plyo on home sessions", () => {
    const day = resolveDayPlan(plan, calendar, "2026-09-29");
    expect(day.sessionId).toBe("tue-hands");
    expect(day.visibleItems.every((i) => !i.name.toLowerCase().includes("jump"))).toBe(
      true,
    );
  });
});
