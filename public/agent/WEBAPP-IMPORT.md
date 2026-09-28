# Setter season webapp — import

**Plan version:** `2026-09-27-f`

Implementation spec (schemas, resolver, rules, checklist): **[`WEBAPP-ENGINEER-HANDOFF.md`](./WEBAPP-ENGINEER-HANDOFF.md)** — that document supersedes this file for engineering detail.

## Bundle (product)

| File | Role |
|------|------|
| `setter-season-workout-plan.json` | Master plan |
| `d2m-fixtures-training-calendar.json` | Week `sessionIds` + fixtures |
| `setter-season-workout-plan.html` | Human-readable reference |
| `setter-jump-periodization-guide.md` | Jump / taper cheat sheet |
| `WEBAPP-IMPORT.md` | This file |

## JackalsVC runtime

| File | Role |
|------|------|
| `setter-season-workout-app.html` | Interactive athlete UI |
| `setter-season-lib.mjs` | Bundled resolver (`src/lib/setter-season/`) |

```bash
npm run build:setter-season   # regenerate JSON + setter-season-lib.mjs
npm test -- src/lib/setter-season/setter-season.test.ts
```

## Rules (short)

- Day content = `trainingCalendarByWeek[].sessionIds` → `sessions` (+ warmups).
- Do not re-derive weeks from `microcycleTemplates` when a calendar row exists.
- Home: no plyo/jumps when `noJumping` / `homeJumpPolicy`.
- Thursday: `thu-pull-core` only (`noLegs`).
- No catch-up heavy legs (`meta.noCatchUpHeavyLegs`).
