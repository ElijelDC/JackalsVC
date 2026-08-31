# Coach mobile app demo

Walkthrough video for coaches using the Jackals VC member app on their phone.

## Files

| File | Description |
|------|-------------|
| `coach-app-demo.mp4` | Mobile demo video (iPhone 14 Pro viewport, ~45s) |
| `coach-app-demo.webm` | Same recording in WebM format |

## Demo account (local only)

- **Email:** `coach.demo@jackalsvc.com`
- **Password:** `coachdemo123`
- **Roles:** Head coach — Division 2 Mens · Cover coach — Division 3 Womens

## What the video covers

1. Sign-in screen
2. Dashboard (payments, squad management, schedule)
3. Add to Home Screen (iOS)
4. Training sign-ups and session detail
5. Matches sign-ups and match detail
6. Coach payments
7. Squad management — training times and fixtures

## Regenerate locally

```bash
npx tsx scripts/seed-test-users.ts
npx tsx scripts/setup-coach-mobile-demo.ts
npm run dev
npx playwright install chromium
npx tsx scripts/record-coach-mobile-demo.ts
```

Output is written to this folder.

## Share with coaches

Send `coach-app-demo.mp4` with a short note:

- Log in at [jackalsvolleyball.com](https://jackalsvolleyball.com)
- On the dashboard, tap **Add to Home Screen** (iPhone) or **Install App** (Android) for quick access
- Use **Training** and **Matches** each week to confirm availability
- Paid coaches can check **Payments** for monthly session totals
