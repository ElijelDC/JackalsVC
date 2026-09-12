# Member app tutorial video

Calm, easy-to-follow walkthrough for Jackals VC **members** (players) on mobile.

## Files

| File | Description |
|------|-------------|
| `member-app-tutorial.mp4` | Shareable tutorial (H.264 + soft ambient music) |
| `member-app-tutorial.webm` | Raw Playwright capture |
| `tutorial-ambient.m4a` | Warm chord-pad background music |
| `../../public/tutorials/member-app-tutorial.mp4` | Served at `/tutorials/member-app-tutorial.mp4` |

## What it covers

1. Sign in (Members Only)
2. Install app + turn on notifications
3. Dashboard (reply colours, Training / Matches / Links)
4. Training RSVP (Attend / Can’t attend)
5. Match RSVP + warm-up times
6. Season fixtures (filter by team)
7. Membership & payments
8. Merch
9. Gallery & club events
10. Profile (password after first login)
11. Menu navigation
12. Closing

## Demo account (local only)

- **Email:** `demo.dashboard@jackalsvc.com`  
- **Password:** `DemoDash123!`  

Do **not** seed this account on production.

## Regenerate locally

```bash
npm run demo:member-tutorial:setup
npm run dev
npx playwright install chromium
npm run demo:member-tutorial:record
```

Output is written to this folder and copied to `public/tutorials/`.

## Share with members

Send `member-app-tutorial.mp4` (or link `https://jackalsvolleyball.com/tutorials/member-app-tutorial.mp4`) with:

- Log in at [jackalsvolleyball.com](https://jackalsvolleyball.com) via **Members Only**
- **Install** the app / Add to Home Screen, then turn on **notifications**
- Reply to **Training** and **Matches** each week
- Use **Fixtures** for the full season schedule
- Update password under **Profile** after first login
