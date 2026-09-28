# Setter season webapp — import

**Plan version:** `2026-09-27-f`

## Files

| File | Purpose |
|------|---------|
| `setter-season-workout-plan.json` | Master plan (`meta`, `sessions`, `warmups`, `prehabDaily`) |
| `d2m-fixtures-training-calendar.json` | `trainingCalendarByWeek[]` + `fixtures[]` |
| `setter-season-lib.mjs` | Bundled `PlanResolver` (from `src/lib/setter-season/`) |
| `setter-season-workout-plan.html` | Athlete UI |

Regenerate data + browser bundle:

```bash
npm run build:setter-season
```

## Rules

- **Day content** comes only from `trainingCalendarByWeek[].sessionIds` → `sessions` (+ warmups).
- Do not rebuild weekly plans from `microcycleTemplates` when a calendar row exists.
- Home: no plyo/jumps when `homeJumpPolicy` / `noJumping` applies.
- Thursday: `thu-pull-core` (`noLegs`).
- No catch-up for skipped heavy leg days (`meta.noCatchUpHeavyLegs`).

See the engineer handoff (2026-09-27-f) for validation checklist and UI scope.
