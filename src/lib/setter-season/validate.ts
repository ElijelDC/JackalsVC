import type { MasterPlan, TrainingCalendar } from "@/lib/setter-season/types";
import { DAY_KEYS } from "@/lib/setter-season/types";

export function validatePlanBundle(
  plan: MasterPlan,
  calendar: TrainingCalendar,
): string[] {
  const errors: string[] = [];

  if (plan.meta.version !== plan.masterPlanVersion) {
    errors.push(
      `meta.version (${plan.meta.version}) !== masterPlanVersion (${plan.masterPlanVersion})`,
    );
  }
  if (calendar.masterPlanVersion !== plan.meta.version) {
    errors.push(
      `calendar.masterPlanVersion (${calendar.masterPlanVersion}) !== plan.meta.version (${plan.meta.version})`,
    );
  }
  if (calendar.version !== plan.version) {
    errors.push(
      `calendar.version (${calendar.version}) !== plan.version (${plan.version})`,
    );
  }

  if (calendar.trainingCalendarByWeek.length !== 29) {
    errors.push(
      `Expected 29 calendar weeks, got ${calendar.trainingCalendarByWeek.length}`,
    );
  }

  const matchWeeks = calendar.trainingCalendarByWeek.filter(
    (w) => w.d2mMatch != null,
  ).length;
  if (matchWeeks !== 14) {
    errors.push(`Expected 14 match weeks, got ${matchWeeks}`);
  }

  for (const week of calendar.trainingCalendarByWeek) {
    const keys = Object.keys(week.sessionIds).sort();
    const expected = [...DAY_KEYS].sort();
    if (keys.join(",") !== expected.join(",")) {
      errors.push(
        `Week ${week.weekStarting}: sessionIds must have exactly 7 weekday keys`,
      );
    }
    for (const dayKey of DAY_KEYS) {
      const sessionId = week.sessionIds[dayKey];
      if (!plan.sessions[sessionId]) {
        errors.push(
          `Week ${week.weekStarting} ${dayKey}: unknown sessionId ${sessionId}`,
        );
      }
    }
  }

  return errors;
}
