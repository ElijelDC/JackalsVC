import type {
  CalendarWeek,
  DayKey,
  DayPlanFlags,
  ExerciseItem,
  Fixture,
  MasterPlan,
  Session,
} from "@/lib/setter-season/types";
import { isWithinHoursBefore, kickOffDateTimeIso } from "@/lib/setter-season/time";

const PLYO_ROLES = new Set(["plyo", "jump", "plyometric"]);
const HEAVY_LEG_SESSION_RE = /mon-leg-a|fri-leg-b/;
const LIGHT_OR_EVE_RE = /-light-|-inseason-reduced|match-eve/;

export function isHeavyLegSessionId(sessionId: string): boolean {
  if (LIGHT_OR_EVE_RE.test(sessionId)) return false;
  return HEAVY_LEG_SESSION_RE.test(sessionId);
}

export function isPlyoItem(item: ExerciseItem): boolean {
  const role = item.role?.toLowerCase() ?? "";
  if (PLYO_ROLES.has(role)) return true;
  const n = item.name.toLowerCase();
  return (
    n.includes("jump") ||
    n.includes("plyo") ||
    n.includes("vert") ||
    n.includes("block jump")
  );
}

export function isHomeSession(session: Session): boolean {
  const loc = session.location?.toLowerCase() ?? "";
  return loc.includes("home") || session.smallSpace === true;
}

export function computeFlags(input: {
  weekRow: CalendarWeek;
  dayKey: DayKey;
  sessionId: string;
  session: Session;
  plan: MasterPlan;
  match: Fixture | null;
  now: Date;
  emergencyDeload: boolean;
}): DayPlanFlags {
  const { weekRow, dayKey, sessionId, session, plan, match, now, emergencyDeload } =
    input;
  const homePolicy =
    weekRow.homeJumpPolicy === "noHomeJumping" ||
    plan.meta.anchors.homeConstraints.noHomeJumping;
  const atHome = isHomeSession(session) || dayKey === "tuesday" || dayKey === "saturday";
  const hidePlyoAtHome =
    homePolicy && (session.noJumping === true || atHome);

  let within48hOfMatch = false;
  if (match) {
    const ko = kickOffDateTimeIso(match.date, match.kickOff);
    if (ko) within48hOfMatch = isWithinHoursBefore(now, ko, 48);
  }

  const matchWeekSatReducedItems =
    within48hOfMatch &&
    sessionId === "sat-home-small-space" &&
    Boolean(session.matchWeekVariant?.within48hItemNumbers?.length);

  return {
    hidePlyoAtHome,
    thursdayNoLegs: session.noLegs === true || sessionId === "thu-pull-core",
    within48hOfMatch,
    emergencyDeload,
    matchWeekSatReducedItems,
  };
}

export function filterVisibleItems(
  session: Session,
  flags: DayPlanFlags,
): ExerciseItem[] {
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
      if (
        n.includes("squat") ||
        n.includes("leg press") ||
        n.includes("rdl") ||
        n.includes("lunge")
      ) {
        return false;
      }
      return true;
    });
  }

  return visible;
}

export function taperTierLabel(tier: CalendarWeek["taperTier"]): string {
  switch (tier) {
    case "buildOrBye":
      return "Build week";
    case "B_preMD1Deload":
      return "Deload — MD1";
    case "A_mesocycleDeload":
      return "Deload week";
    case "C_matchWeekMicroTaper":
      return "Micro-taper";
    default:
      return tier;
  }
}
