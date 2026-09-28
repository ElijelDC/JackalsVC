import {
  computeFlags,
  filterVisibleItems,
} from "@/lib/setter-season/plan-rules";
import {
  addDays,
  dayKeyForIso,
  isoDateInTimeZone,
  weekContainsDate,
} from "@/lib/setter-season/time";
import type {
  AthleteAppState,
  CalendarWeek,
  DayKey,
  DayPlan,
  Fixture,
  MasterPlan,
  TrainingCalendar,
  Warmup,
} from "@/lib/setter-season/types";
import { DAY_KEYS } from "@/lib/setter-season/types";

export function findCalendarWeek(
  calendar: TrainingCalendar,
  isoDate: string,
): CalendarWeek | null {
  return (
    calendar.trainingCalendarByWeek.find((row) =>
      weekContainsDate(row.weekStarting, isoDate),
    ) ?? null
  );
}

export function getSessionId(weekRow: CalendarWeek, dayKey: DayKey): string {
  return weekRow.sessionIds[dayKey];
}

function defaultWarmup(sessionId: string, plan: MasterPlan): Warmup | null {
  const prehab = plan.prehabDaily;
  if (
    sessionId === "sun-match-day" ||
    sessionId === "sat-match-day"
  ) {
    return {
      title: "Pre-match warm-up",
      blocks: [
        {
          phase: "Activate",
          min: prehab.durationMin,
          items: [...prehab.items, "Team warm-up per coach"],
        },
      ],
    };
  }
  if (
    sessionId === "sun-prehab-track" ||
    sessionId === "sun-recovery-prehab"
  ) {
    return {
      title: "Daily prehab",
      blocks: [
        { phase: "Mobilize", min: prehab.durationMin, items: prehab.items },
      ],
    };
  }
  return {
    title: "RAMP warm-up",
    blocks: [
      {
        phase: "Raise",
        min: plan.warmups.durationMin,
        items: [plan.warmups.protocol],
      },
    ],
  };
}

function matchForDay(
  weekRow: CalendarWeek,
  dayKey: DayKey,
): Fixture | null {
  const match = weekRow.d2mMatch;
  if (!match) return null;
  if (dayKey === "sunday" && match.dayOfWeek === "Sun") return match;
  if (dayKey === "saturday" && match.dayOfWeek === "Sat") return match;
  return null;
}

function emergencyDeloadActive(
  state: AthleteAppState | undefined,
  isoDate: string,
): boolean {
  if (!state?.emergencyDeloadUntil) return false;
  return isoDate <= state.emergencyDeloadUntil;
}

const EMERGENCY_SESSION_IDS: Record<DayKey, string> = {
  monday: "sun-prehab-track",
  tuesday: "sun-prehab-track",
  wednesday: "wed-club-only",
  thursday: "sun-prehab-track",
  friday: "sun-prehab-track",
  saturday: "sun-prehab-track",
  sunday: "sun-prehab-track",
};

export function getDayPlan(
  weekRow: CalendarWeek,
  dayKey: DayKey,
  plan: MasterPlan,
  options?: {
    isoDate?: string;
    now?: Date;
    appState?: AthleteAppState;
  },
): DayPlan {
  const isoDate = options?.isoDate ?? addDays(weekRow.weekStarting, DAY_KEYS.indexOf(dayKey));
  const now = options?.now ?? new Date();
  const emergencyDeload = emergencyDeloadActive(options?.appState, isoDate);

  let sessionId = getSessionId(weekRow, dayKey);
  if (emergencyDeload) {
    sessionId = EMERGENCY_SESSION_IDS[dayKey];
  }

  const session = plan.sessions[sessionId];
  if (!session) {
    throw new Error(`Unknown sessionId: ${sessionId}`);
  }

  const warmup =
    plan.warmups.bySessionId[sessionId] ??
    defaultWarmup(sessionId, plan);

  const match = matchForDay(weekRow, dayKey);
  const flags = computeFlags({
    weekRow,
    dayKey,
    sessionId,
    session,
    plan,
    match,
    now,
    emergencyDeload,
  });

  const visibleItems = filterVisibleItems(session, flags);

  return {
    date: isoDate,
    dayKey,
    weekStarting: weekRow.weekStarting,
    phase: weekRow.phase,
    taperTier: weekRow.taperTier,
    microcycleTemplate: weekRow.microcycleTemplate,
    homeJumpPolicy: weekRow.homeJumpPolicy,
    sessionId,
    session,
    warmup,
    dailyOutline: weekRow.dailyOutline?.[dayKey],
    notes: weekRow.notes ?? [],
    match,
    flags,
    visibleItems,
  };
}

export function resolveDayPlan(
  plan: MasterPlan,
  calendar: TrainingCalendar,
  dateInput: Date | string,
  appState?: AthleteAppState,
): DayPlan {
  const isoDate =
    typeof dateInput === "string"
      ? dateInput
      : isoDateInTimeZone(dateInput);
  const weekRow = findCalendarWeek(calendar, isoDate);
  if (!weekRow) {
    throw new Error(`No calendar week for ${isoDate}`);
  }
  const dayKey = dayKeyForIso(isoDate);
  return getDayPlan(weekRow, dayKey, plan, {
    isoDate,
    now:
      typeof dateInput === "string"
        ? parseReferenceDate(dateInput)
        : dateInput,
    appState,
  });
}

function parseReferenceDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function weekDayPlans(
  plan: MasterPlan,
  calendar: TrainingCalendar,
  weekStarting: string,
  appState?: AthleteAppState,
): DayPlan[] {
  const weekRow = calendar.trainingCalendarByWeek.find(
    (w) => w.weekStarting === weekStarting,
  );
  if (!weekRow) {
    throw new Error(`Unknown weekStarting: ${weekStarting}`);
  }
  return DAY_KEYS.map((dayKey) => {
    const isoDate = addDays(weekStarting, DAY_KEYS.indexOf(dayKey));
    return getDayPlan(weekRow, dayKey, plan, {
      isoDate,
      appState,
    });
  });
}
