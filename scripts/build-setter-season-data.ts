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

function fx(
  matchDay: number,
  dayOfWeek: "Sat" | "Sun",
  date: string,
  homeAway: "Home" | "Away",
  opponent: string,
  kickOff: string,
  warmUp: string,
  template: MicrocycleTemplate,
): Fixture {
  return {
    matchDay,
    dayOfWeek,
    date,
    homeAway,
    opponent,
    warmUp,
    kickOff,
    venue: "TBC",
    status: "confirmed",
    microcycleTemplate: template,
  };
}

const FIXTURES: Fixture[] = [
  fx(1, "Sun", "2026-10-11", "Home", "BMP Titans", "13:00", "12:30", "matchDaySunday"),
  fx(2, "Sun", "2026-10-18", "Home", "Gardians Masters", "15:30", "14:30", "matchDaySunday"),
  fx(3, "Sun", "2026-10-25", "Away", "Dalkey Devils", "10:00", "09:00", "matchDaySunday"),
  fx(4, "Sun", "2026-11-15", "Home", "Kilkenny Spartans", "10:30", "09:30", "matchDaySunday"),
  fx(5, "Sun", "2026-11-29", "Away", "IVI Dinosaurs", "16:00", "15:00", "matchDaySunday"),
  fx(6, "Sun", "2026-12-06", "Home", "Gardians Panda", "10:30", "09:30", "matchDaySunday"),
  fx(7, "Sun", "2026-12-13", "Home", "Impact Macroom", "13:00", "12:00", "matchDaySunday"),
  fx(8, "Sat", "2027-01-09", "Away", "BMP Titans", "15:30", "14:30", "matchDaySaturday"),
  fx(9, "Sat", "2027-01-23", "Away", "Gardians Masters", "18:30", "17:30", "matchDaySaturday"),
  fx(10, "Sun", "2027-02-14", "Home", "Dalkey Devils", "13:00", "12:00", "matchDaySunday"),
  fx(11, "Sat", "2027-03-06", "Away", "Kilkenny Spartans", "16:00", "15:00", "matchDaySaturday"),
  fx(12, "Sun", "2027-03-14", "Home", "IVI Dinosaurs", "10:30", "09:30", "matchDaySunday"),
  fx(13, "Sat", "2027-04-10", "Away", "Gardians Panda", "16:00", "15:00", "matchDaySaturday"),
  fx(14, "Sun", "2027-04-18", "Away", "Impact Macroom", "14:00", "13:00", "matchDaySunday"),
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
        item(1, "Leg press or hack squat", "5×3–5", {
          role: "mainStrength",
          rpe: "8–9",
          restMin: 2.5,
        }),
        item(2, "Leg curl", "3×10–12", { role: "legs", rpe: "7" }),
        item(3, "Hang power clean (or high pull)", "4×3", {
          role: "olympicLift",
          rpe: "7–8",
          restMin: 2,
          notes: "Weeks 1–2: hang high pull 4×4 (no catch). Knee → partial catch; shoulder pain → high pull only.",
        }),
        item(4, "Hip thrust", "2×8", { role: "legs", rpe: "7–8" }),
        item(5, "Standing calf raise", "3×12", { role: "legs" }),
        item(6, "Chest or neutral-grip press", "3×6–8", { role: "push", rpe: "7–8" }),
        item(7, "Shoulder press or landmine + triceps", "3×8", { role: "push" }),
        item(8, "Standing two-foot vertical 4×3 + block jumps 4×3–4", "4×3 + 4×3–4", {
          role: "plyo",
          restSec: 90,
          notes: "90 s rest, max height. Then 3×12 crunch and 8 min bike.",
        }),
      ],
    },
    "mon-leg-a-push-plyo-inseason-reduced": {
      title: "Monday · Flyefit · Reduced (match/deload week)",
      location: "Flyefit",
      items: [
        item(1, "Leg press", "3×3–5", { role: "mainStrength", rpe: "8" }),
        item(2, "Leg curl", "2×10", { role: "legs" }),
        item(3, "Hang power clean", "2×3", {
          role: "olympicLift",
          notes: "Or high pull. Skip if match <48 h or knee >3/10.",
        }),
        item(4, "Calf raise", "2×12", { role: "legs" }),
        item(5, "Push pair", "2×8", { role: "push" }),
        item(6, "Standing vert + block", "2×3 each", {
          role: "plyo",
          restSec: 90,
        }),
      ],
    },
    "tue-hands": {
      title: "Tuesday · Home · Hands / knees / setting",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Shoulder ER hold + scap push-up", "3×20 s + 3×10", { role: "prehab" }),
        item(2, "Wall sit + short split squat", "2×30 s · 2×8/leg", { role: "legs" }),
        item(3, "Single-leg calf raise (wall)", "2×12/leg", { role: "legs" }),
        item(4, "Towel squeeze + finger band spreads", "2×30 s · 2×15", { role: "prehab" }),
        item(5, "1 kg wall sets", "4×20", { role: "skill" }),
        item(6, "Volleyball to taped X", "4×15", { role: "skill" }),
        item(7, "Setter footwork in place", "3×20 s", { role: "skill" }),
      ],
    },
    "tue-hands-light-small-space": {
      title: "Tuesday · Home · Light (match week)",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Prehab ER + fingers", "8 min", { role: "prehab" }),
        item(2, "1 kg wall sets", "3×15", { role: "skill" }),
        item(3, "Volleyball to X", "3×12", { role: "skill" }),
        item(4, "Wall sit", "2×25 s", { role: "isometric" }),
      ],
    },
    "thu-pull-core": {
      title: "Thursday · Flyefit · Pull + core (no legs)",
      location: "Flyefit",
      noLegs: true,
      items: [
        item(1, "Lat pulldown or pull-up", "4×6–8", { role: "pull", rpe: "7–8" }),
        item(2, "Seated row", "3×10", { role: "pull" }),
        item(3, "Single-arm row", "2×10/arm", { role: "pull" }),
        item(4, "Face pull + ER", "3×15 + 3×12", { role: "pull" }),
        item(5, "Bicep curl", "3×10", { role: "pull" }),
        item(6, "Hanging knee raise + Pallof", "3×10", { role: "core" }),
        item(7, "Farmer or plate pinch", "3×40 s", { role: "grip" }),
        item(8, "Cardio incline walk or row", "12 min", { role: "cardio" }),
      ],
    },
    "fri-leg-b-push": {
      title: "Friday · Flyefit · Leg B + clean + push (bye weeks)",
      location: "Flyefit",
      items: [
        item(1, "Romanian deadlift", "4×4–6", {
          role: "mainStrength",
          rpe: "8–9",
          restMin: 2.5,
          notes: "3 s eccentric",
        }),
        item(2, "Leg curl", "3×10–12", { role: "legs" }),
        item(3, "Power clean (floor) or hang clean", "4×3", {
          role: "olympicLift",
          rpe: "7–8",
          notes: "Bye weeks only. Alternate floor vs hang. No heavy cleans within 48 h of NL.",
        }),
        item(4, "Split squat", "2×6–8/leg", { role: "legs" }),
        item(5, "Incline or landmine press", "3×6–8", { role: "push" }),
        item(6, "Triceps", "3×10", { role: "push" }),
        item(7, "Pallof + dead bug", "3×10/side", { role: "core" }),
        item(8, "Cardio", "10 min moderate", { role: "cardio" }),
      ],
    },
    "fri-leg-b-light-inseason": {
      title: "Friday · Flyefit · Light legs (Sunday NL)",
      location: "Flyefit",
      items: [
        item(1, "Romanian deadlift", "2×5", { role: "mainStrength", rpe: "7" }),
        item(2, "Leg curl", "2×10", { role: "legs" }),
        item(3, "Split squat", "2×6/leg", { role: "legs" }),
        item(4, "Core", "2 rounds", { role: "core", notes: "Skip session if Wednesday crushed legs." }),
      ],
    },
    "fri-match-eve-activation": {
      title: "Friday · Home · Match eve activation (Saturday NL)",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Prehab", "12 min", { role: "prehab" }),
        item(2, "Shadow block + calf", "2×8 · 2×15", { role: "activation" }),
        item(3, "1 kg wall sets", "2×15", { role: "skill" }),
        item(4, "Walk or easy bike", "10 min", { role: "cardio" }),
      ],
    },
    "sat-home-small-space": {
      title: "Saturday · Home · Small space",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      matchWeekVariant: { within48hItemNumbers: [1, 5, 6] },
      items: [
        item(1, "Wrist curls 1 kg + fingertip wall presses", "2×15 · 3×15", { role: "prehab" }),
        item(2, "Single-leg calf + quad hold", "3×12/leg · 2×20 s/leg", { role: "legs" }),
        item(3, "Wall sit + towel TKE", "2×35 s · 2×15/leg", { role: "isometric" }),
        item(4, "Shadow block in place (no jump)", "3×8", { role: "skill" }),
        item(5, "1 kg four-way wall sets + quick hands", "10 each · 2×20", { role: "skill" }),
        item(6, "Volleyball targets + back-set footwork", "25 to X · 2×10 back", { role: "skill" }),
      ],
    },
    "sat-match-eve-activation-small-space": {
      title: "Saturday · Home · Match eve (Sunday NL)",
      location: "Home",
      smallSpace: true,
      noJumping: true,
      items: [
        item(1, "Prehab", "12 min", { role: "prehab" }),
        item(2, "Calf raises + shadow block", "2×12 · 2×6", { role: "activation" }),
        item(3, "Easy volleyball to wall", "15 reps", { role: "skill" }),
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
        item(1, "Daily prehab", "12 min", { role: "prehab" }),
        item(2, "Optional walk", "easy", { role: "recovery" }),
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
    "Terminal knee extension 2×15/leg",
    "Sit-to-stand 2×10",
    "Glute bridge 2×12",
    "Single-leg balance 2×30 s/side",
    "External rotation 2×12",
    "Wall scap push-up 2×12",
    "Finger band spreads 2×15",
    "Fingertip wall pressure 3×20 s",
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
          setting: "Daily prehab, Tue/Sat home, Thu grip, Wed club",
          knees: "Daily TKE/balance, Mon/Fri legs, home wall sit/calf/TKE",
          jump: "Mon Flyefit jumps + Wed/NL court; never home max jumps",
          upperBody: "Mon + Fri push, Thu pull",
          lean: "Thu/Fri cardio, protein ~1.6 g/kg, sleep",
        },
      },
      olympicLiftProgression: {
        kneeShoulderRules:
          "Weeks 1–2 hang high pull 4×4 (no catch). Week 3+ hang power clean Mon. Knee → partial catch; shoulder pain → high pull only; no heavy cleans 48 h before match.",
      },
      realisticTargets: {
        note: "8–12 weeks (good adherence): often +2–5 cm early; up to +3–7 cm over ~12 weeks — individual variation ±2–3 cm. Log standing two-foot only (same wall, same shoes).",
      },
    },
    sessions,
    warmups: {
      durationMin: 15,
      protocol:
        "15 min RAMP after optional daily prehab. See blocks for Flyefit Mon (full vs in-season), Thu pull, Fri bye vs light, home, club, match.",
      bySessionId: {
        "mon-leg-a-push-plyo": {
          title: "Flyefit Monday (full bye week)",
          blocks: [
            { phase: "Raise", min: 3, items: ["Bike/row easy → moderate"] },
            {
              phase: "Activate",
              min: 4,
              items: [
                "TKE 2×12/leg",
                "Glute bridge 2×10",
                "Hip abduction 2×10/side",
                "Balance 2×20 s/side",
                "Band ER 2×10/side",
              ],
            },
            {
              phase: "Mobilize",
              min: 3,
              items: ["Leg swings", "Ankle rocks", "90/90 hip", "Open books"],
            },
            {
              phase: "Potentiate",
              min: 5,
              items: [
                "Empty RDL",
                "Hang high pull ramp",
                "Leg press warm sets",
                "2 easy reaches before jumps",
              ],
            },
          ],
        },
        "mon-leg-a-push-plyo-inseason-reduced": {
          title: "Flyefit Monday (in-season / deload)",
          blocks: [
            { phase: "Raise", min: 3, items: ["Bike easy"] },
            { phase: "Activate", min: 4, items: ["TKE", "Bridge", "ER", "Calf"] },
            { phase: "Mobilize", min: 3, items: ["Leg swings", "Ankles", "Scap push-ups"] },
            {
              phase: "Potentiate",
              min: 5,
              items: ["Clean ramp", "1 leg press set", "1 easy + 1×80% jump"],
            },
          ],
        },
        "thu-pull-core": {
          title: "Flyefit Thursday (pull — no legs)",
          blocks: [
            { phase: "Raise", min: 3, items: ["Row or bike"] },
            { phase: "Activate", min: 4, items: ["Band", "Scap", "Dead bug", "Wrist"] },
            { phase: "Mobilize", min: 4, items: ["T-spine", "Shoulders"] },
            { phase: "Potentiate", min: 4, items: ["Light pulldown + row ramp"] },
          ],
        },
        "fri-leg-b-push": {
          title: "Flyefit Friday (bye — RDL + clean + push)",
          blocks: [
            { phase: "Raise", min: 3, items: ["Bike"] },
            { phase: "Activate", min: 4, items: ["TKE", "Glute", "Ham", "Balance"] },
            { phase: "Mobilize", min: 3, items: ["Hinge", "Leg swings"] },
            { phase: "Potentiate", min: 5, items: ["RDL + clean + light press ramp"] },
          ],
        },
        "fri-leg-b-light-inseason": {
          title: "Flyefit Friday (light — before Sun match)",
          blocks: [
            { phase: "Raise", min: 3, items: ["Bike"] },
            { phase: "Activate", min: 5, items: ["Activate circuit"] },
            { phase: "Mobilize", min: 4, items: ["Mobilize"] },
            {
              phase: "Potentiate",
              min: 3,
              items: ["RDL empty + 50%×5 only (no heavy clean)"],
            },
          ],
        },
        "tue-hands": {
          title: "Home Tue / Sat / match eve",
          blocks: [
            { phase: "Raise", min: 3, items: ["March or walk"] },
            { phase: "Activate", min: 5, items: ["Wrists", "ER", "Knees"] },
            { phase: "Mobilize", min: 4, items: ["Mobility"] },
            { phase: "Potentiate", min: 4, items: ["Easy wall sets"] },
          ],
        },
        "wed-club-only": {
          title: "Wed club 19:00",
          blocks: [
            { phase: "Raise", min: 3, items: ["Jog"] },
            { phase: "Activate", min: 4, items: ["Knee", "Hip", "ER"] },
            { phase: "Mobilize", min: 4, items: ["Mobility"] },
            {
              phase: "Potentiate",
              min: 4,
              items: ["Team warm-up + easy sets (submax jumps only if knee ≤3/10)"],
            },
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
        "MD1 Sun 11 Oct 13:00 vs BMP Titans (Home, warm-up 12:30). Sat 10 Oct: no Flyefit — prehab + easy wall sets only.",
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
