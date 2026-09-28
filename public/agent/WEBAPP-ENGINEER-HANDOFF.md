# Webapp engineer handoff — Setter S&C plan (D2M Jackals 2026–27)

**Audience:** Engineer agent implementing a training webapp (or mobile) for one athlete.  
**Plan version:** `2026-09-27-f` (sync `meta.version` in master JSON, `masterPlanVersion` in calendar JSON, root `version` in master JSON).  
**Scope:** Full NL season **2026-09-27 → 2027-04-18** (29 calendar weeks, 14 confirmed fixtures). Not preseason-only.

**Repo implementation (JackalsVC):** Static app at [`/agent/setter-season-workout-plan.html`](./setter-season-workout-plan.html). Resolver source: `src/lib/setter-season/`. Regenerate JSON + browser bundle: `npm run build:setter-season`. Short import notes: [`WEBAPP-IMPORT.md`](./WEBAPP-IMPORT.md).

---

## 1. Source files (bundle these)

| File | Role |
|------|------|
| `setter-season-workout-plan.json` | Master plan: `meta`, `sessions`, `warmups`, `prehabDaily`, `microcycleTemplates`, `weeklyScheduleByeWeek`, prescriptions |
| `d2m-fixtures-training-calendar.json` | Authoritative **week-by-week** `sessionIds` + match metadata |
| `setter-season-workout-plan.html` | Interactive athlete app (Today / Week / Prehab / Tools) |
| `setter-season-workout-plan.reference.html` | Short human-readable pointer (optional “about”) |
| `setter-jump-periodization-guide.md` | Short rep-scheme cheat sheet |
| `setter-season-lib.mjs` | Bundled plan resolver for the static app (from `src/lib/setter-season/`) |
| `WEBAPP-IMPORT.md` | Minimal import notes |
| `WEBAPP-ENGINEER-HANDOFF.md` | This document |

**Legacy:** Files named `setter-preseason-workout-plan.*` are preseason-only; do not import old names for the full-season product.

---

## 2. Product summary

### Athlete defaults (from JSON; make profile-editable later)

- **Position:** Setter · **Height:** 172 cm · **Team:** D2M Jackals · **League:** Volleyball Ireland Division 2 Men  
- **Standing vert baseline:** 23 in / 58.4 cm (standing two-foot wall touch — primary logged metric)  
- **Fixed weekly anchors:** Flyefit **Mon / Thu / Fri** · Home **Tue / Sat** · **Wed club 19:00–21:00** (no extra gym that day)  
- **Home:** small space · **no running shuttles** · **no max jumping at home**  
- **Injury context (copy only):** post-knee issues, right shoulder — UI should surface substitutions from session `notes` / `olympicLiftProgression.kneeShoulderRules`

### What the app must do

1. Show **today’s session** (warmup + main) from calendar + session catalog.  
2. Show **week view** with NL banner when `d2mMatch` present (opponent, H/A, warm-up, kick-off, venue).  
3. Enforce **home jump policy** and **Thu no-legs** rule in UI (hide/filter plyo at home).  
4. Support **completion logging** (optional sets/RPE) and **Sunday vertical touch log** (cm).  
5. Support **emergency deload** mode (user-triggered or rule-based) — see §7.  
6. Do **not** “catch up” skipped sessions (copy in meta: no makeup heavy legs).

---

## 3. Architecture recommendation

```
┌─────────────────────┐     ┌──────────────────────────────┐
│ Master plan JSON    │     │ Calendar JSON                 │
│ sessions, warmups,  │     │ trainingCalendarByWeek[]      │
│ meta, templates     │     │ sessionIds per Mon–Sun          │
└─────────┬───────────┘     └──────────────┬───────────────┘
          │                              │
          └──────────┬───────────────────┘
                     ▼
          PlanResolver(date | weekStarting)
                     │
                     ▼
          DayPlan { sessionId, session, warmup, match?, flags }
                     │
                     ▼
          UI: Week · Day · Session · Trackers
```

- **Single source of truth for “what to do this day”:** `trainingCalendarByWeek[].sessionIds`  
- **Templates (`microcycleTemplates`)** are documentation + fallback if you regenerate calendar; **do not re-derive weekly plan from templates** if calendar row exists.  
- **`weeklyScheduleByeWeek`** equals `developmentWeek` template; use for “generic bye week” preview only.

**In this repo:** `resolveDayPlan`, `weekDayPlans`, `findCalendarWeek` live in `src/lib/setter-season/plan-resolver.ts` and are bundled to `setter-season-lib.mjs`.

---

## 4. Core resolution algorithm

### 4.1 Find calendar week for a date

- Weeks use **`weekStarting`** (ISO date, Monday).  
- For any user date `D`, find the row where `weekStarting <= D < weekStarting + 7 days` (use consistent timezone; athlete is Ireland / `Europe/Dublin`).

### 4.2 Get session for weekday

```ts
const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;

function getSessionId(weekRow: CalendarWeek, dayKey: typeof DAYS[number]): string {
  return weekRow.sessionIds[dayKey]; // required on every row
}

function getDayPlan(weekRow: CalendarWeek, dayKey: typeof DAYS[number], plan: MasterPlan): DayPlan {
  const sessionId = getSessionId(weekRow, dayKey);
  const session = plan.sessions[sessionId];
  if (!session) throw new Error(`Unknown sessionId: ${sessionId}`);

  const warmup = plan.warmups.bySessionId[sessionId] ?? defaultWarmup(sessionId, plan);

  return {
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
    match: dayKey === "saturday" || dayKey === "sunday"
      ? matchForDay(weekRow, dayKey)
      : null,
    flags: computeFlags(weekRow, dayKey, plan),
  };
}
```

### 4.3 Match attachment

- If `weekRow.d2mMatch` is non-null, fixture usually falls on **Sat or Sun** per `microcycleTemplate`:  
  - `matchDaySunday` → match on **sunday** (`sun-match-day`)  
  - `matchDaySaturday` → match on **saturday** (`sat-match-day`)  
- Merge `fixtures[]` top-level list for static schedule page; **per-week `d2mMatch`** drives banners.

### 4.4 Default warmup when missing

`warmups.bySessionId` has **no** entries for: `sun-match-day`, `sat-match-day`, `sun-recovery-prehab`, `sun-prehab-track`.

**Fallback:**

- Match days → show `prehabDaily` (12 min) + copy from session (`warmUp: "prehab + team warm-up"`).  
- `sun-prehab-track` / `sun-recovery-prehab` → prehab only + tracking fields from session.  
- Unknown → generic 15 min RAMP text from `warmups.protocol`.

---

## 5. Data schemas

### 5.1 Calendar week (`trainingCalendarByWeek[]`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `weekStarting` | `string` (ISO date) | yes | Monday |
| `phase` | enum | yes | `deloadPreMD1` \| `inSeasonMatchWeek` \| `inSeasonByeWeek` |
| `microcycleTemplate` | enum | yes | `matchDaySunday` \| `matchDaySaturday` \| `developmentWeek` |
| `d2mMatch` | object \| null | yes | Same shape as `fixtures[]` entry when match week |
| `sessionIds` | `{ monday..sunday: string }` | yes | **Only** day keys; no extra keys |
| `dailyOutline` | `{ monday..sunday: string }` | optional | Human summary for UI subtitle |
| `taperTier` | string | yes | See §6 |
| `homeJumpPolicy` | `"noHomeJumping"` | yes | |
| `notes` | `string[]` | optional | Week-level alerts |

### 5.2 Session (`sessions[sessionId]`)

Two shapes:

**A. Exercise list session** — `items: ExerciseItem[]`

```ts
type ExerciseItem = {
  n: number;
  name: string;
  scheme: string;       // display + logging hint, e.g. "4x3", "3x10-12"
  rpe?: string;
  restMin?: number;
  restSec?: number;
  role?: string;        // mainStrength, plyo, push, pull, olympicLift, ...
  notes?: string;
};
```

Optional session-level: `location`, `smallSpace`, `noJumping`, `noLegs`, `goalTags`, `evidenceTag`, `description`, `matchWeekVariant`.

**B. Non-lifting session** — minimal objects:

| sessionId | Purpose |
|-----------|---------|
| `wed-club-only` | Club 19:00; `prehabBeforeClub: "12 min"` |
| `sat-match-day` / `sun-match-day` | `match: true` |
| `sun-recovery-prehab` | Recovery |
| `sun-prehab-track` | Prehab + **`tracking`** array for vert/knee/shoulder |

### 5.3 Warmup (`warmups.bySessionId[sessionId]`)

```ts
type Warmup = {
  title: string;
  blocks: { phase: "Raise"|"Activate"|"Mobilize"|"Potentiate"; min: number; items: string[] }[];
};
```

Global: `warmups.durationMin === 15`, `warmups.protocol` (RAMP description).

### 5.4 Daily prehab (`prehabDaily`)

- `durationMin: 12`  
- `items: string[]` — show every day as optional morning block (independent of session).

---

## 6. Taper tiers & volume logic

| `taperTier` | Meaning | UI |
|-------------|---------|-----|
| `buildOrBye` | Full bye-week gym (`developmentWeek`) | Badge “Build week” |
| `B_preMD1Deload` | Pre–MD1 deload | Badge “Deload — MD1” |
| `A_mesocycleDeload` | Every 4th week (~40% volume) | Badge “Deload week” |
| `C_matchWeekMicroTaper` | NL match week | Match banner + “Micro-taper” |

**Prescription detail:** `meta.verticalJumpPrescription.phases` (`build` | `deload` | `matchWeek` | `matchEve`) and `meta.deloadAndTaperSystem` (tiers A–D, `beforeEachMatch` 72h/48h/24h).

**App behavior (rules engine):**

1. **`homeConstraints.noHomeJumping`** (master `meta.anchors.homeConstraints`): If session has `noJumping: true` or `homeJumpPolicy === "noHomeJumping"`, **never render plyo/jump exercises** on home sessions.  
2. **`thu-pull-core`:** Session has `noLegs: true` — hide leg compounds if you split by `role`.  
3. **Heavy legs:** Only sessions whose id matches `/mon-leg-a/` or `/fri-leg-b/` (exclude `-light-`, `match-eve`).  
4. **48h before NL kick-off:** Parse `d2mMatch.kickOff` + `date`. If user opens a Fri/Sat plan within 48h, show warning; suggest activation sessions only (calendar already swaps sessionIds — don’t override upward to heavy).  
5. **Fri cleans:** `fri-leg-b-push` item 3 notes: **bye weeks only**; match weeks use `fri-leg-b-light-inseason` or `fri-match-eve-activation`.  
6. **Sat home match-week variant:** `sat-home-small-space.matchWeekVariant` — if NL within 48h, show reduced item list (items 1, 5, 6 only).  
7. **Emergency deload (`D_emergencyDeload`):** Triggers: standing touch down 2 Sundays OR knee >3/10 OR 3 poor sleep nights → **5 days:** `prehabDaily` + Wed club only. Implement as user state that overrides `sessionIds` to prehab/club stubs.  
8. **No catch-up:** Skipped gym days stay skipped; do not stack sessions.

### Special calendar note (MD1 week)

Week `2026-10-05`: MD1 Sun 11 Oct. Week notes: **Sat 10 Oct** — no Flyefit; prehab + easy wall sets only. If your UI allows “skip gym” prompts, surface `dailyOutline` / `notes` for that Saturday.

---

## 7. Session catalog (all `sessionId` keys)

| sessionId | Location | Summary |
|-----------|----------|---------|
| `mon-leg-a-push-plyo` | Flyefit | Full legs + hang power clean + push + **4×3** standing vert & block |
| `mon-leg-a-push-plyo-inseason-reduced` | Flyefit | Match/deload Mon: **3×3–5** legs, **2×3** jumps, 2×3 clean |
| `tue-hands` | Home | Full hands/knees/setting (~7 items) |
| `tue-hands-light-small-space` | Home | Match-week light home |
| `thu-pull-core` | Flyefit | Pull + core + cardio, **no legs** |
| `fri-leg-b-push` | Flyefit | RDL + **power/hang clean** + push (bye weeks) |
| `fri-leg-b-light-inseason` | Flyefit | Light RDL/curl before **Sunday** match |
| `fri-match-eve-activation` | Home | Before **Saturday** NL |
| `sat-home-small-space` | Home | Skills/isometrics, no jumps |
| `sat-match-eve-activation-small-space` | Home | Before **Sunday** NL |
| `sat-match-day` | Match | NL Saturday |
| `sun-match-day` | Match | NL Sunday |
| `sun-recovery-prehab` | Home/rest | Post-Saturday match recovery |
| `sun-prehab-track` | Home | Prehab + **vert/knee/shoulder tracking** |
| `wed-club-only` | Club | Wed 19:00 only |

---

## 8. UI screens (MVP → v1)

### MVP

1. **Today** — warmup blocks (collapsible) + exercise checklist + location badge (Flyefit / Home / Club / Match).  
2. **Week** — 7 tiles from `sessionIds`; highlight match day; show `taperTier` + `phase`.  
3. **Match detail** — from `d2mMatch`: opponent, venue, warmUp, kickOff, H/A, travel hint from `notes`.  
4. **Daily prehab** — always accessible (12 min list).  
5. **Trackers (Sunday)** — when session is `sun-prehab-track`: fields for standing touch (cm), Δ vs 58.4, knee 0–10, shoulder 0–10.

### v1

- History charts (vert, pain, compliance).  
- Olympic lift progression indicator (`meta.olympicLiftProgression.progressionWeeks` — weeks 1–2 high pull).  
- Evidence links (`meta.researchEvidence.findings[].url`).  
- Export JSON for coach.

---

## 9. TypeScript types (optional paste-in)

```ts
type DayKey = "monday"|"tuesday"|"wednesday"|"thursday"|"friday"|"saturday"|"sunday";

interface CalendarWeek {
  weekStarting: string;
  phase: "deloadPreMD1"|"inSeasonMatchWeek"|"inSeasonByeWeek";
  microcycleTemplate: "matchDaySunday"|"matchDaySaturday"|"developmentWeek";
  d2mMatch: Fixture | null;
  sessionIds: Record<DayKey, string>;
  dailyOutline?: Record<DayKey, string>;
  taperTier: "buildOrBye"|"B_preMD1Deload"|"A_mesocycleDeload"|"C_matchWeekMicroTaper";
  homeJumpPolicy: "noHomeJumping";
  notes?: string[];
}

interface Fixture {
  matchDay: number;
  dayOfWeek: "Sat"|"Sun";
  date: string;
  homeAway: "Home"|"Away";
  opponent: string;
  warmUp: string;
  kickOff: string;
  venue: string;
  status: string;
  microcycleTemplate: string;
}
```

Canonical types in repo: `src/lib/setter-season/types.ts`.

---

## 10. Import / sync checklist

- [ ] Load both JSON files at startup; validate `masterPlanVersion` matches `meta.version`.  
- [ ] Assert every `sessionIds` value exists in `sessions`.  
- [ ] Assert every `sessionIds` key is exactly 7 weekdays.  
- [ ] Assert `trainingCalendarByWeek.length === 29`.  
- [ ] Assert 14 weeks have non-null `d2mMatch`.  
- [ ] Render warmup when present; fallback §4.4 when absent.  
- [ ] Filter plyo on home per §6.  
- [ ] Unit test: week `2026-10-05` Sunday → `sun-match-day` + MD1 metadata.  
- [ ] Unit test: bye week → Monday `mon-leg-a-push-plyo`.  
- [ ] Unit test: Thu always `thu-pull-core`.

**Automated in repo:** `src/lib/setter-season/setter-season.test.ts` + `validatePlanBundle()`.

---

## 11. Fixtures list (static schedule)

| MD | Date | Day | Opponent | KO |
|----|------|-----|----------|-----|
| 1 | 2026-10-11 | Sun | BMP Titans | 13:00 |
| 2 | 2026-10-18 | Sun | Gardians Masters | 15:30 |
| 3 | 2026-10-25 | Sun | Dalkey Devils | 10:00 |
| 4 | 2026-11-15 | Sun | Kilkenny Spartans | 10:30 |
| 5 | 2026-11-29 | Sun | IVI Dinosaurs | 16:00 |
| 6 | 2026-12-06 | Sun | Gardians Panda | 10:30 |
| 7 | 2026-12-13 | Sun | Impact Macroom | 13:00 |
| 8 | 2027-01-09 | Sat | BMP Titans | 15:30 |
| 9 | 2027-01-23 | Sat | Gardians Masters | 18:30 |
| 10 | 2027-02-14 | Sun | Dalkey Devils | 13:00 |
| 11 | 2027-03-06 | Sat | Kilkenny Spartans | 16:00 |
| 12 | 2027-03-14 | Sun | IVI Dinosaurs | 10:30 |
| 13 | 2027-04-10 | Sat | Gardians Panda | 16:00 |
| 14 | 2027-04-18 | Sun | Impact Macroom | 14:00 |

**Saturday NL weeks (MD 8, 9, 11, 13):** Friday = home activation (`fri-match-eve-activation`), not heavy Flyefit legs.

---

## 12. Content / copy blocks for app

- **Goal coverage map:** `meta.anchors.goalCoverage` (setting, knees, jump, upper body, lean).  
- **Realistic vert copy:** `meta.athlete.realisticTargets` + honesty note — avoid guaranteed inch claims.  
- **References:** `meta.references` / `researchEvidence` for “Why these reps?” screen.

---

## 13. Out of scope (unless product asks)

- Multi-athlete teams, coach dashboards, Flyefit API, automatic RPE from wearables.  
- Approach-jump logging (plan prioritizes **standing** vert only).  
- Generating new calendars — engineer **imports** provided JSON; updates come from new file drops.

---

## 14. Questions for product owner (non-blocking)

1. Persist completions locally only or sync to backend?  
2. Should emergency deload be one-tap or auto-suggest from trackers?  
3. Show full `evidenceTag` per session or hide in “advanced”?

---

*End of handoff. Primary implementation path: **calendar `sessionIds` → `sessions` + `warmups`**, with rules in §6.*
