/**
 * Generates setter-season-workout-plan.json + d2m-fixtures-training-calendar.json
 * from handoff rules (version 2026-09-27-f).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { validatePlanBundle } from "../src/lib/setter-season/validate";
import type {
  CalendarWeek,
  DayKey,
  ExerciseItem,
  Fixture,
  MasterPlan,
  MicrocycleTemplate,
  Phase,
  TaperTier,
  TrainingCalendar,
} from "../src/lib/setter-season/types";
import { DAY_KEYS } from "../src/lib/setter-season/types";
import { addDays } from "../src/lib/setter-season/time";

const VERSION = "2026-09-27-f";
const ROOT = path.resolve(import.meta.dirname, "..");
const AGENT = path.join(ROOT, "public/agent");

const FIXTURES: Fixture[] = [
  {
    matchDay: 1,
    dayOfWeek: "Sun",
    date: "2026-10-11",
    homeAway: "Home",
    opponent: "BMP Titans",
    warmUp: "12:00",
    kickOff: "13:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 2,
    dayOfWeek: "Sun",
    date: "2026-10-18",
    homeAway: "Away",
    opponent: "Gardians Masters",
    warmUp: "14:30",
    kickOff: "15:30",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 3,
    dayOfWeek: "Sun",
    date: "2026-10-25",
    homeAway: "Home",
    opponent: "Dalkey Devils",
    warmUp: "09:00",
    kickOff: "10:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 4,
    dayOfWeek: "Sun",
    date: "2026-11-15",
    homeAway: "Away",
    opponent: "Kilkenny Spartans",
    warmUp: "09:30",
    kickOff: "10:30",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 5,
    dayOfWeek: "Sun",
    date: "2026-11-29",
    homeAway: "Home",
    opponent: "IVI Dinosaurs",
    warmUp: "15:00",
    kickOff: "16:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 6,
    dayOfWeek: "Sun",
    date: "2026-12-06",
    homeAway: "Away",
    opponent: "Gardians Panda",
    warmUp: "09:30",
    kickOff: "10:30",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 7,
    dayOfWeek: "Sun",
    date: "2026-12-13",
    homeAway: "Home",
    opponent: "Impact Macroom",
    warmUp: "12:00",
    kickOff: "13:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 8,
    dayOfWeek: "Sat",
    date: "2027-01-09",
    homeAway: "Home",
    opponent: "BMP Titans",
    warmUp: "14:30",
    kickOff: "15:30",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySaturday",
  },
  {
    matchDay: 9,
    dayOfWeek: "Sat",
    date: "2027-01-23",
    homeAway: "Away",
    opponent: "Gardians Masters",
    warmUp: "17:30",
    kickOff: "18:30",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySaturday",
  },
  {
    matchDay: 10,
    dayOfWeek: "Sun",
    date: "2027-02-14",
    homeAway: "Home",
    opponent: "Dalkey Devils",
    warmUp: "12:00",
    kickOff: "13:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 11,
    dayOfWeek: "Sat",
    date: "2027-03-06",
    homeAway: "Away",
    opponent: "Kilkenny Spartans",
    warmUp: "15:00",
    kickOff: "16:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySaturday",
  },
  {
    matchDay: 12,
    dayOfWeek: "Sun",
    date: "2027-03-14",
    homeAway: "Home",
    opponent: "IVI Dinosaurs",
    warmUp: "09:30",
    kickOff: "10:30",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
  {
    matchDay: 13,
    dayOfWeek: "Sat",
    date: "2027-04-10",
    homeAway: "Away",
    opponent: "Gardians Panda",
    warmUp: "15:00",
    kickOff: "16:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySaturday",
  },
  {
    matchDay: 14,
    dayOfWeek: "Sun",
    date: "2027-04-18",
    homeAway: "Home",
    opponent: "Impact Macroom",
    warmUp: "13:00",
    kickOff: "14:00",
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: "matchDaySunday",
  },
];

function item(
  n: number,
  name: string,
  scheme: string,
  extra?: Partial<ExerciseItem>,
): ExerciseItem {
  return { n, name, scheme, ...extra };
}

function buildMasterPlan(): MasterPlan {
  const sessions: MasterPlan["sessions"] = {
    "mon-leg-a-push-plyo": {
      title: "Monday · Flyefit · Leg A + push + plyo",
      location: "Flyefit",
      items: [
        item(1, "Leg press or hack squat", "4x8-10", { role: "mainStrength" }),
        item(2, "Leg curl", "3x10-12", { role: "legs" }),
        item(3, "Hip thrust", "3x10", { role: "legs" }),
        item(4, "Standing calf raise", "3x12-15", { role: "legs" }),
        item(5, "Chest press", "3x8-10", { role: "push" }),
        item(6, "Hang power clean", "4x3", {
          role: "olympicLift",
          notes: "Substitute high pull if knee/shoulder flare",
        }),
        item(7, "Standing vertical touch", "4x3", {
          role: "plyo",
          notes: "Log Sunday; no max jumping at home",
        }),
        item(8, "Block jumps", "3x4", { role: "plyo", restSec: 90 }),
      ],
    },
    "mon-leg-a-push-plyo-inseason-reduced": {
      title: "Monday · Flyefit · Reduced (match/deload week)",
      location: "Flyefit",
      matchWeekVariant: undefined,
      items: [
        item(1, "Leg press", "3x3-5", { role: "mainStrength" }),
        item(2, "Leg curl", "2x8-10", { role: "legs" }),
        item(3, "Chest press", "2x8", { role: "push" }),
        item(4, "Hang power clean", "2x3", { role: "olympicLift" }),
        item(5, "Standing vertical touch", "2x3", { role: "plyo" }),
      ],
    },
    "tue-hands": {
      title: "Tuesday · Home · Hands & setting",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Wall setting series", "3x20", { role: "skill" }),
        item(2, "Tennis ball wall taps", "3x30", { role: "skill" }),
        item(3, "Kneeling float sets", "4x12", { role: "skill" }),
        item(4, "Band ER + scap", "2x12", { role: "prehab" }),
        item(5, "Wrist prep circuit", "1x5 min", { role: "prehab" }),
        item(6, "Core dead bug", "3x8/side", { role: "core" }),
        item(7, "Single-leg balance", "2x30s/side", { role: "prehab" }),
      ],
    },
    "tue-hands-light-small-space": {
      title: "Tuesday · Home · Light hands (match week)",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Wall setting", "2x15", { role: "skill" }),
        item(2, "Float sets", "2x10", { role: "skill" }),
        item(3, "Band ER", "2x12", { role: "prehab" }),
        item(4, "Core plank", "2x30s", { role: "core" }),
      ],
    },
    "thu-pull-core": {
      title: "Thursday · Flyefit · Pull + core (no legs)",
      location: "Flyefit",
      noLegs: true,
      items: [
        item(1, "Lat pulldown or pull-up", "4x8-10", { role: "pull" }),
        item(2, "Chest-supported row", "3x10-12", { role: "pull" }),
        item(3, "Face pull", "3x15", { role: "pull" }),
        item(4, "Pallof press", "3x10/side", { role: "core" }),
        item(5, "Bike or rower", "12-15 min", { role: "cardio" }),
      ],
    },
    "fri-leg-b-push": {
      title: "Friday · Flyefit · Leg B + clean + push (bye weeks)",
      location: "Flyefit",
      items: [
        item(1, "Romanian deadlift", "4x8", { role: "mainStrength" }),
        item(2, "Leg curl", "3x10", { role: "legs" }),
        item(3, "Power or hang clean", "4x3", {
          role: "olympicLift",
          notes: "Bye weeks only — not before NL match",
        }),
        item(4, "Incline press", "3x8-10", { role: "push" }),
        item(5, "Triceps + core", "3x12", { role: "push" }),
      ],
    },
    "fri-leg-b-light-inseason": {
      title: "Friday · Flyefit · Light legs (Sunday NL)",
      location: "Flyefit",
      items: [
        item(1, "Romanian deadlift", "2x8", { role: "mainStrength" }),
        item(2, "Leg curl", "2x10", { role: "legs" }),
        item(3, "Push-ups or landmine press", "2x10", { role: "push" }),
      ],
    },
    "fri-match-eve-activation": {
      title: "Friday · Home · Match eve activation (Saturday NL)",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Glute bridge + band walks", "2x12", { role: "activation" }),
        item(2, "Med ball chest pass", "2x8", { role: "activation" }),
        item(3, "Wall setting", "2x15", { role: "skill" }),
        item(4, "Easy bike or walk", "10 min", { role: "cardio" }),
      ],
    },
    "sat-home-small-space": {
      title: "Saturday · Home · Skills & isometrics",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      matchWeekVariant: { within48hItemNumbers: [1, 5, 6] },
      items: [
        item(1, "Wall sit", "3x30s", { role: "isometric" }),
        item(2, "Setting footwork", "3x10", { role: "skill" }),
        item(3, "Band ER", "2x12", { role: "prehab" }),
        item(4, "Calf raises", "2x15", { role: "prehab" }),
        item(5, "Core dead bug", "2x8/side", { role: "core" }),
        item(6, "Easy wall sets", "2x15", { role: "skill" }),
      ],
    },
    "sat-match-eve-activation-small-space": {
      title: "Saturday · Home · Eve activation (Sunday NL)",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Activation circuit", "10 min", { role: "activation" }),
        item(2, "Light setting", "2x12", { role: "skill" }),
        item(3, "Mobility flow", "8 min", { role: "mobility" }),
      ],
    },
    "sat-match-day": {
      title: "Saturday · NL match day",
      location: "Match",
      match: true,
      warmUp: "prehab + team warm-up",
    },
    "sun-match-day": {
      title: "Sunday · NL match day",
      location: "Match",
      match: true,
      warmUp: "prehab + team warm-up",
    },
    "sun-recovery-prehab": {
      title: "Sunday · Recovery & prehab",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Walk or easy cycle", "15-20 min", { role: "recovery" }),
        item(2, "Foam roll + stretch", "10 min", { role: "mobility" }),
      ],
    },
    "sun-prehab-track": {
      title: "Sunday · Prehab + tracking",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      tracking: [
        { id: "touchCm", label: "Standing wall touch (cm)" },
        { id: "knee", label: "Knee pain 0–10" },
        { id: "shoulder", label: "Shoulder pain 0–10" },
      ],
      items: [
        item(1, "Daily prehab circuit", "12 min", { role: "prehab" }),
      ],
    },
    "wed-club-only": {
      title: "Wednesday · Club training",
      location: "Club",
      prehabBeforeClub: "12 min",
      description: "Jackals D2M 19:00–21:00 — no extra gym",
    },
  };

  const prehabItems = [
    "Terminal knee extension (towel) 2×15/leg",
    "Glute bridge 2×12",
    "Single-leg balance 2×30s/side",
    "Band external rotation 2×12 (right shoulder)",
    "Wrist + finger prep 3 min",
  ];

  const byeWeek: Record<DayKey, string> = {
    monday: "mon-leg-a-push-plyo",
    tuesday: "tue-hands",
    wednesday: "wed-club-only",
    thursday: "thu-pull-core",
    friday: "fri-leg-b-push",
    saturday: "sat-home-small-space",
    sunday: "sun-prehab-track",
  };

  return {
    version: VERSION,
    masterPlanVersion: VERSION,
    meta: {
      version: VERSION,
      title: "Setter S&C · D2M Jackals 2026–27",
      timezone: "Europe/Dublin",
      noCatchUpHeavyLegs: true,
      athlete: {
        position: "Setter",
        heightCm: 172,
        team: "D2M Jackals",
        league: "Volleyball Ireland Division 2 Men",
        standingVertBaselineCm: 58.4,
        injuryContext: "Post-knee issues, right shoulder — use session notes & substitutions",
      },
      anchors: {
        flyefitDays: ["monday", "thursday", "friday"],
        homeDays: ["tuesday", "saturday"],
        clubDay: "wednesday",
        clubWindow: "19:00–21:00",
        homeConstraints: {
          noRunningShuttles: true,
          noHomeJumping: true,
        },
        goalCoverage: {
          setting: "Tue/Sat home skill blocks",
          knees: "Prehab daily + conservative leg progressions",
          jump: "Flyefit plyo only; standing touch logged Sundays",
          upperBody: "Mon/Fri push, Thu pull",
          lean: "Conditioning on pull day",
        },
      },
      olympicLiftProgression: {
        kneeShoulderRules:
          "Weeks 1–2: high pull instead of full clean if needed. Stop if knee >3/10.",
      },
      realisticTargets: {
        note: "Standing vert is variable — focus on trends, not guaranteed inches.",
      },
    },
    sessions,
    warmups: {
      durationMin: 15,
      protocol:
        "RAMP: 5 min raise, 4 min activate, 4 min mobilize, 2 min potentiate (see blocks per session).",
      bySessionId: {
        "mon-leg-a-push-plyo": {
          title: "Flyefit · Leg A day",
          blocks: [
            {
              phase: "Raise",
              min: 5,
              items: ["Bike or row 5 min easy"],
            },
            {
              phase: "Activate",
              min: 4,
              items: ["Glute bridge", "Band walks", "Ankle rocks"],
            },
            {
              phase: "Mobilize",
              min: 4,
              items: ["Hip flexor stretch", "T-spine rotations"],
            },
            {
              phase: "Potentiate",
              min: 2,
              items: ["2×3 submaximal jumps (gym only)"],
            },
          ],
        },
        "thu-pull-core": {
          title: "Flyefit · Pull day",
          blocks: [
            { phase: "Raise", min: 5, items: ["Row 5 min"] },
            { phase: "Activate", min: 5, items: ["Band pull-aparts", "Scap push-ups"] },
            { phase: "Mobilize", min: 5, items: ["Shoulder CARs", "Thoracic opener"] },
          ],
        },
        "tue-hands": {
          title: "Home · Setting",
          blocks: [
            { phase: "Raise", min: 4, items: ["March + arm circles"] },
            { phase: "Activate", min: 4, items: ["Wrist prep", "Band ER"] },
            { phase: "Mobilize", min: 4, items: ["Hip + ankle mobility"] },
          ],
        },
      },
    },
    prehabDaily: { durationMin: 12, items: prehabItems },
    microcycleTemplates: {
      matchDaySunday: "Sun NL — Fri light legs, Sat eve activation",
      matchDaySaturday: "Sat NL — Fri home activation, Sun recovery",
      developmentWeek: "Bye / build week — full gym template",
    },
    weeklyScheduleByeWeek: byeWeek,
  };
}

function fixtureInWeek(weekStarting: string, fixtures: Fixture[]): Fixture | null {
  const end = addDays(weekStarting, 7);
  return (
    fixtures.find((f) => f.date >= weekStarting && f.date < end) ?? null
  );
}

function sessionIdsForTemplate(
  template: MicrocycleTemplate,
  taperTier: TaperTier,
  weekStarting: string,
): Record<DayKey, string> {
  const reducedMon =
    taperTier === "C_matchWeekMicroTaper" ||
    taperTier === "A_mesocycleDeload" ||
    taperTier === "B_preMD1Deload";

  if (template === "developmentWeek") {
    const ids = { ...buildMasterPlan().weeklyScheduleByeWeek };
    if (taperTier === "A_mesocycleDeload" || taperTier === "B_preMD1Deload") {
      ids.monday = "mon-leg-a-push-plyo-inseason-reduced";
      ids.friday = "fri-leg-b-light-inseason";
    }
    if (weekStarting === "2026-10-05") {
      ids.saturday = "sun-prehab-track";
      ids.friday = "fri-leg-b-light-inseason";
    }
    return ids;
  }

  if (template === "matchDaySunday") {
    return {
      monday: reducedMon
        ? "mon-leg-a-push-plyo-inseason-reduced"
        : "mon-leg-a-push-plyo-inseason-reduced",
      tuesday: "tue-hands-light-small-space",
      wednesday: "wed-club-only",
      thursday: "thu-pull-core",
      friday: "fri-leg-b-light-inseason",
      saturday: "sat-match-eve-activation-small-space",
      sunday: "sun-match-day",
    };
  }

  return {
    monday: reducedMon
      ? "mon-leg-a-push-plyo-inseason-reduced"
      : "mon-leg-a-push-plyo-inseason-reduced",
    tuesday: "tue-hands-light-small-space",
    wednesday: "wed-club-only",
    thursday: "thu-pull-core",
    friday: "fri-match-eve-activation",
    saturday: "sat-match-day",
    sunday: "sun-recovery-prehab",
  };
}

function buildCalendar(plan: MasterPlan): TrainingCalendar {
  const weeks: CalendarWeek[] = [];
  // 29 weeks: first Mon 2026-09-28 … last Mon 2027-04-12 (MD14 Sun 18 Apr).
  let weekStarting = "2026-09-28";

  for (let i = 0; i < 29; i++) {
    const match = fixtureInWeek(weekStarting, FIXTURES);
    const template: MicrocycleTemplate = match
      ? match.microcycleTemplate
      : "developmentWeek";

    let phase: Phase = match ? "inSeasonMatchWeek" : "inSeasonByeWeek";
    let taperTier: TaperTier = match ? "C_matchWeekMicroTaper" : "buildOrBye";

    if (weekStarting === "2026-10-05") {
      phase = "deloadPreMD1";
      taperTier = "B_preMD1Deload";
    } else if (!match && (i + 1) % 4 === 0) {
      taperTier = "A_mesocycleDeload";
    }

    const notes: string[] = [];
    if (weekStarting === "2026-10-05") {
      notes.push(
        "MD1 Sun 11 Oct — Sat 10 Oct: no Flyefit; prehab + easy wall sets only.",
      );
    }

    const dailyOutline: Partial<Record<DayKey, string>> = {};
    if (weekStarting === "2026-10-05") {
      dailyOutline.saturday = "Prehab + easy wall sets only (no gym)";
    }

    weeks.push({
      weekStarting,
      phase,
      microcycleTemplate: template,
      d2mMatch: match,
      sessionIds: sessionIdsForTemplate(template, taperTier, weekStarting),
      dailyOutline: dailyOutline as Record<DayKey, string>,
      taperTier,
      homeJumpPolicy: "noHomeJumping",
      notes: notes.length ? notes : undefined,
    });

    weekStarting = addDays(weekStarting, 7);
  }

  return {
    version: VERSION,
    masterPlanVersion: VERSION,
    fixtures: FIXTURES,
    trainingCalendarByWeek: weeks,
  };
}

function main() {
  const plan = buildMasterPlan();
  const calendar = buildCalendar(plan);
  const errors = validatePlanBundle(plan, calendar);
  if (errors.length) {
    console.error("Validation failed:\n", errors.join("\n"));
    process.exit(1);
  }

  writeFileSync(
    path.join(AGENT, "setter-season-workout-plan.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  writeFileSync(
    path.join(AGENT, "d2m-fixtures-training-calendar.json"),
    `${JSON.stringify(calendar, null, 2)}\n`,
  );
  console.log("Wrote setter-season-workout-plan.json and d2m-fixtures-training-calendar.json");
}

main();
