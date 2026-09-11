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

1. Sign in  
2. Dashboard overview  
3. Training & Matches panels (reply colours)  
4. Events, Videos, Links  
5. Training RSVP (Attend / Can’t attend)  
6. Match RSVP + warm-up times  
7. Season fixtures (filter by team)  
8. Membership & payments  
9. Merch  
10. Gallery  
11. Video playlists  
12. Club events  
13. Profile (password, email, matchday, newsletter)  
14. Menu navigation  
15. Add to Home Screen / Install  
16. Closing  

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

Output is written to this folder.

## Share with members

Send `member-app-tutorial.mp4` with:

- Log in at [jackalsvolleyball.com](https://jackalsvolleyball.com)  
- Reply to **Training** and **Matches** each week  
- Use **Fixtures** for the full season schedule  
- Update password under **Profile** after first login  
