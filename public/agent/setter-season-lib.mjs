// src/lib/setter-season/types.ts
var DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

// src/lib/setter-season/time.ts
var DUBLIN = "Europe/Dublin";
function isoDateInTimeZone(date, timeZone = DUBLIN) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
function parseIsoDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
function addDays(iso, days) {
  const dt = parseIsoDate(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return isoDateInTimeZone(dt, "UTC");
}
function dayKeyForIso(iso) {
  const dt = parseIsoDate(iso);
  const dow = dt.getUTCDay();
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];
  return map[dow];
}
function weekContainsDate(weekStarting, iso) {
  const end = addDays(weekStarting, 7);
  return iso >= weekStarting && iso < end;
}
function kickOffDateTimeIso(matchDate, kickOff) {
  const m = kickOff.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = matchDate.split("-").map(Number);
  const hour = Number(m[1]);
  const min = Number(m[2]);
  return new Date(Date.UTC(y, mo - 1, d, hour - 1, min, 0));
}
function isWithinHoursBefore(now, target, hours) {
  const ms = target.getTime() - now.getTime();
  return ms > 0 && ms <= hours * 60 * 60 * 1e3;
}

// src/lib/setter-season/plan-rules.ts
var PLYO_ROLES = /* @__PURE__ */ new Set(["plyo", "jump", "plyometric"]);
function isPlyoItem(item) {
  const role = item.role?.toLowerCase() ?? "";
  if (PLYO_ROLES.has(role)) return true;
  const n = item.name.toLowerCase();
  return n.includes("jump") || n.includes("plyo") || n.includes("vert") || n.includes("block jump");
}
function isHomeSession(session) {
  const loc = session.location?.toLowerCase() ?? "";
  return loc.includes("home") || session.smallSpace === true;
}
function computeFlags(input) {
  const { weekRow, dayKey, sessionId, session, plan, match, now, emergencyDeload } = input;
  const homePolicy = weekRow.homeJumpPolicy === "noHomeJumping" || plan.meta.anchors.homeConstraints.noHomeJumping;
  const atHome = isHomeSession(session) || dayKey === "tuesday" || dayKey === "saturday";
  const hidePlyoAtHome = homePolicy && (session.noJumping === true || atHome);
  let within48hOfMatch = false;
  if (match) {
    const ko = kickOffDateTimeIso(match.date, match.kickOff);
    if (ko) within48hOfMatch = isWithinHoursBefore(now, ko, 48);
  }
  const matchWeekSatReducedItems = within48hOfMatch && sessionId === "sat-home-small-space" && Boolean(session.matchWeekVariant?.within48hItemNumbers?.length);
  return {
    hidePlyoAtHome,
    thursdayNoLegs: session.noLegs === true || sessionId === "thu-pull-core",
    within48hOfMatch,
    emergencyDeload,
    matchWeekSatReducedItems
  };
}
function filterVisibleItems(session, flags) {
  const items = session.items ?? [];
  let visible = items;
  if (flags.matchWeekSatReducedItems && session.matchWeekVariant) {
    const keep = new Set(session.matchWeekVariant.within48hItemNumbers);
    visible = visible.filter((item) => keep.has(item.n));
  }
  if (flags.hidePlyoAtHome) {
    visible = visible.filter((item) => !isPlyoItem(item));
  }
  if (flags.thursdayNoLegs) {
    visible = visible.filter((item) => {
      const role = item.role?.toLowerCase() ?? "";
      if (role.includes("leg") && role !== "pull") return false;
      const n = item.name.toLowerCase();
      if (n.includes("squat") || n.includes("leg press") || n.includes("rdl") || n.includes("lunge")) {
        return false;
      }
      return true;
    });
  }
  return visible;
}
function taperTierLabel(tier) {
  switch (tier) {
    case "buildOrBye":
      return "Build week";
    case "B_preMD1Deload":
      return "Deload \u2014 MD1";
    case "A_mesocycleDeload":
      return "Deload week";
    case "C_matchWeekMicroTaper":
      return "Micro-taper";
    default:
      return tier;
  }
}

// src/lib/setter-season/plan-resolver.ts
function findCalendarWeek(calendar, isoDate) {
  return calendar.trainingCalendarByWeek.find(
    (row) => weekContainsDate(row.weekStarting, isoDate)
  ) ?? null;
}
function getSessionId(weekRow, dayKey) {
  return weekRow.sessionIds[dayKey];
}
function defaultWarmup(sessionId, plan) {
  const prehab = plan.prehabDaily;
  if (sessionId === "sun-match-day" || sessionId === "sat-match-day") {
    return {
      title: "Pre-match warm-up",
      blocks: [
        {
          phase: "Activate",
          min: prehab.durationMin,
          items: [...prehab.items, "Team warm-up per coach"]
        }
      ]
    };
  }
  if (sessionId === "sun-prehab-track" || sessionId === "sun-recovery-prehab") {
    return {
      title: "Daily prehab",
      blocks: [
        { phase: "Mobilize", min: prehab.durationMin, items: prehab.items }
      ]
    };
  }
  return {
    title: "RAMP warm-up",
    blocks: [
      {
        phase: "Raise",
        min: plan.warmups.durationMin,
        items: [plan.warmups.protocol]
      }
    ]
  };
}
function matchForDay(weekRow, dayKey) {
  const match = weekRow.d2mMatch;
  if (!match) return null;
  if (dayKey === "sunday" && match.dayOfWeek === "Sun") return match;
  if (dayKey === "saturday" && match.dayOfWeek === "Sat") return match;
  return null;
}
function emergencyDeloadActive(state, isoDate) {
  if (!state?.emergencyDeloadUntil) return false;
  return isoDate <= state.emergencyDeloadUntil;
}
var EMERGENCY_SESSION_IDS = {
  monday: "sun-prehab-track",
  tuesday: "sun-prehab-track",
  wednesday: "wed-club-only",
  thursday: "sun-prehab-track",
  friday: "sun-prehab-track",
  saturday: "sun-prehab-track",
  sunday: "sun-prehab-track"
};
function getDayPlan(weekRow, dayKey, plan, options) {
  const isoDate = options?.isoDate ?? addDays(weekRow.weekStarting, DAY_KEYS.indexOf(dayKey));
  const now = options?.now ?? /* @__PURE__ */ new Date();
  const emergencyDeload = emergencyDeloadActive(options?.appState, isoDate);
  let sessionId = getSessionId(weekRow, dayKey);
  if (emergencyDeload) {
    sessionId = EMERGENCY_SESSION_IDS[dayKey];
  }
  const session = plan.sessions[sessionId];
  if (!session) {
    throw new Error(`Unknown sessionId: ${sessionId}`);
  }
  const warmup = plan.warmups.bySessionId[sessionId] ?? defaultWarmup(sessionId, plan);
  const match = matchForDay(weekRow, dayKey);
  const flags = computeFlags({
    weekRow,
    dayKey,
    sessionId,
    session,
    plan,
    match,
    now,
    emergencyDeload
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
    visibleItems
  };
}
function resolveDayPlan(plan, calendar, dateInput, appState) {
  const isoDate = typeof dateInput === "string" ? dateInput : isoDateInTimeZone(dateInput);
  const weekRow = findCalendarWeek(calendar, isoDate);
  if (!weekRow) {
    throw new Error(`No calendar week for ${isoDate}`);
  }
  const dayKey = dayKeyForIso(isoDate);
  return getDayPlan(weekRow, dayKey, plan, {
    isoDate,
    now: typeof dateInput === "string" ? parseReferenceDate(dateInput) : dateInput,
    appState
  });
}
function parseReferenceDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
function weekDayPlans(plan, calendar, weekStarting, appState) {
  const weekRow = calendar.trainingCalendarByWeek.find(
    (w) => w.weekStarting === weekStarting
  );
  if (!weekRow) {
    throw new Error(`Unknown weekStarting: ${weekStarting}`);
  }
  return DAY_KEYS.map((dayKey) => {
    const isoDate = addDays(weekStarting, DAY_KEYS.indexOf(dayKey));
    return getDayPlan(weekRow, dayKey, plan, {
      isoDate,
      appState
    });
  });
}

// src/lib/setter-season/validate.ts
function validatePlanBundle(plan, calendar) {
  const errors = [];
  if (plan.meta.version !== plan.masterPlanVersion) {
    errors.push(
      `meta.version (${plan.meta.version}) !== masterPlanVersion (${plan.masterPlanVersion})`
    );
  }
  if (calendar.masterPlanVersion !== plan.meta.version) {
    errors.push(
      `calendar.masterPlanVersion (${calendar.masterPlanVersion}) !== plan.meta.version (${plan.meta.version})`
    );
  }
  if (calendar.version !== plan.version) {
    errors.push(
      `calendar.version (${calendar.version}) !== plan.version (${plan.version})`
    );
  }
  if (calendar.trainingCalendarByWeek.length !== 29) {
    errors.push(
      `Expected 29 calendar weeks, got ${calendar.trainingCalendarByWeek.length}`
    );
  }
  const matchWeeks = calendar.trainingCalendarByWeek.filter(
    (w) => w.d2mMatch != null
  ).length;
  if (matchWeeks !== 14) {
    errors.push(`Expected 14 match weeks, got ${matchWeeks}`);
  }
  for (const week of calendar.trainingCalendarByWeek) {
    const keys = Object.keys(week.sessionIds).sort();
    const expected = [...DAY_KEYS].sort();
    if (keys.join(",") !== expected.join(",")) {
      errors.push(
        `Week ${week.weekStarting}: sessionIds must have exactly 7 weekday keys`
      );
    }
    for (const dayKey of DAY_KEYS) {
      const sessionId = week.sessionIds[dayKey];
      if (!plan.sessions[sessionId]) {
        errors.push(
          `Week ${week.weekStarting} ${dayKey}: unknown sessionId ${sessionId}`
        );
      }
    }
  }
  return errors;
}
export {
  DAY_KEYS,
  findCalendarWeek,
  getDayPlan,
  resolveDayPlan,
  taperTierLabel,
  validatePlanBundle,
  weekDayPlans
};
