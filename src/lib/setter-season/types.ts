export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export type Phase =
  | "deloadPreMD1"
  | "inSeasonMatchWeek"
  | "inSeasonByeWeek";

export type MicrocycleTemplate =
  | "matchDaySunday"
  | "matchDaySaturday"
  | "developmentWeek";

export type TaperTier =
  | "buildOrBye"
  | "B_preMD1Deload"
  | "A_mesocycleDeload"
  | "C_matchWeekMicroTaper";

export interface Fixture {
  matchDay: number;
  dayOfWeek: "Sat" | "Sun";
  date: string;
  homeAway: "Home" | "Away";
  opponent: string;
  warmUp: string;
  kickOff: string;
  venue: string;
  status: string;
  microcycleTemplate: MicrocycleTemplate;
}

export interface CalendarWeek {
  weekStarting: string;
  phase: Phase;
  microcycleTemplate: MicrocycleTemplate;
  d2mMatch: Fixture | null;
  sessionIds: Record<DayKey, string>;
  dailyOutline?: Record<DayKey, string>;
  taperTier: TaperTier;
  homeJumpPolicy: "noHomeJumping";
  notes?: string[];
}

export interface ExerciseItem {
  n: number;
  name: string;
  scheme: string;
  rpe?: string;
  restMin?: number;
  restSec?: number;
  role?: string;
  notes?: string;
}

export interface Session {
  id?: string;
  title?: string;
  location?: string;
  smallSpace?: boolean;
  noJumping?: boolean;
  noLegs?: boolean;
  goalTags?: string[];
  evidenceTag?: string;
  description?: string;
  matchWeekVariant?: { within48hItemNumbers: number[] };
  match?: boolean;
  prehabBeforeClub?: string;
  warmUp?: string;
  items?: ExerciseItem[];
  tracking?: { id: string; label: string; unit?: string }[];
}

export interface WarmupBlock {
  phase: "Raise" | "Activate" | "Mobilize" | "Potentiate";
  min: number;
  items: string[];
}

export interface Warmup {
  title: string;
  blocks: WarmupBlock[];
}

export interface MasterPlan {
  version: string;
  masterPlanVersion: string;
  meta: {
    version: string;
    title: string;
    timezone: string;
    noCatchUpHeavyLegs: boolean;
    athlete: {
      position: string;
      heightCm: number;
      team: string;
      league: string;
      standingVertBaselineCm: number;
      injuryContext?: string;
    };
    anchors: {
      flyefitDays: DayKey[];
      homeDays: DayKey[];
      clubDay: DayKey;
      clubWindow: string;
      homeConstraints: { noRunningShuttles: boolean; noHomeJumping: boolean };
      goalCoverage?: Record<string, string>;
    };
    verticalJumpPrescription?: unknown;
    deloadAndTaperSystem?: unknown;
    olympicLiftProgression?: { kneeShoulderRules?: string };
    realisticTargets?: unknown;
    references?: unknown;
    researchEvidence?: unknown;
  };
  sessions: Record<string, Session>;
  warmups: {
    durationMin: number;
    protocol: string;
    bySessionId: Record<string, Warmup>;
  };
  prehabDaily: { durationMin: number; items: string[] };
  microcycleTemplates: Record<string, unknown>;
  weeklyScheduleByeWeek: Record<DayKey, string>;
}

export interface TrainingCalendar {
  version: string;
  masterPlanVersion: string;
  fixtures: Fixture[];
  trainingCalendarByWeek: CalendarWeek[];
}

export interface DayPlanFlags {
  hidePlyoAtHome: boolean;
  thursdayNoLegs: boolean;
  within48hOfMatch: boolean;
  emergencyDeload: boolean;
  matchWeekSatReducedItems: boolean;
}

export interface DayPlan {
  date: string;
  dayKey: DayKey;
  weekStarting: string;
  phase: Phase;
  taperTier: TaperTier;
  microcycleTemplate: MicrocycleTemplate;
  homeJumpPolicy: "noHomeJumping";
  sessionId: string;
  session: Session;
  warmup: Warmup | null;
  dailyOutline?: string;
  notes: string[];
  match: Fixture | null;
  flags: DayPlanFlags;
  visibleItems: ExerciseItem[];
}

export interface AthleteAppState {
  emergencyDeloadUntil?: string | null;
  completions: Record<string, boolean>;
  sundayLogs: Record<string, { touchCm?: number; knee?: number; shoulder?: number }>;
}
