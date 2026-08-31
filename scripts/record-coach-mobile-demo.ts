/**
 * Record a mobile coach app walkthrough video with Playwright.
 *
 * Prerequisites:
 *   npm run dev   (or DEMO_BASE_URL pointing at a running app)
 *   npx tsx scripts/setup-coach-mobile-demo.ts
 *   npx playwright install chromium
 *
 * Output:
 *   docs/coach-mobile-demo/coach-app-demo.webm
 *   docs/coach-mobile-demo/coach-app-demo.mp4  (if ffmpeg is available)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices, type Page } from "playwright";

const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3005";
const DEMO_EMAIL = process.env.COACH_DEMO_EMAIL ?? "coach.demo@jackalsvc.com";
const DEMO_PASSWORD = process.env.COACH_DEMO_PASSWORD ?? "coachdemo123";
const OUTPUT_DIR = path.join(process.cwd(), "docs/coach-mobile-demo");
const STEP_PAUSE_MS = Number(process.env.DEMO_STEP_PAUSE_MS ?? "2800");

async function pause(page: Page, ms = STEP_PAUSE_MS) {
  await page.waitForTimeout(ms);
}

async function showCaption(page: Page, text: string) {
  await page.evaluate((caption) => {
    document.getElementById("coach-demo-caption")?.remove();
    const el = document.createElement("div");
    el.id = "coach-demo-caption";
    el.textContent = caption;
    el.setAttribute(
      "style",
      [
        "position:fixed",
        "left:12px",
        "right:12px",
        "bottom:72px",
        "z-index:99999",
        "padding:12px 14px",
        "border-radius:14px",
        "background:rgba(8,8,12,0.92)",
        "border:1px solid rgba(239,68,68,0.35)",
        "color:#fff",
        "font:600 14px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
        "text-align:center",
        "box-shadow:0 8px 32px rgba(0,0,0,0.45)",
        "pointer-events:none",
      ].join(";"),
    );
    document.body.appendChild(el);
  }, text);
  await pause(page, 1200);
}

async function dismissOverlays(page: Page) {
  const closeButtons = page.locator('button[aria-label="Close"], button:has-text("Close")');
  if (await closeButtons.first().isVisible().catch(() => false)) {
    await closeButtons.first().click().catch(() => undefined);
  }
}

async function authenticateSession(page: Page) {
  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      callbackUrl: `${BASE_URL}/dashboard`,
      json: "true",
    },
  });
}

async function showLoginIntro(page: Page) {
  await page.goto(`${BASE_URL}/?auth=signin&callbackUrl=/dashboard`, {
    waitUntil: "networkidle",
  });
  await dismissOverlays(page);
  await page.getByRole("heading", { name: "Members only" }).waitFor({
    state: "visible",
  });
  await showCaption(
    page,
    "Sign in at jackalsvolleyball.com with your coach email and password",
  );
  await pause(page, 1800);
}

async function login(page: Page) {
  await authenticateSession(page);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await dismissOverlays(page);
}

async function scrollSlow(page: Page, pixels = 420) {
  await page.evaluate((amount) => {
    window.scrollBy({ top: amount, behavior: "smooth" });
  }, pixels);
  await pause(page, 1400);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const iPhone = devices["iPhone 14 Pro"];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 390, height: 844 },
    },
    locale: "en-IE",
    timezoneId: "Europe/Dublin",
  });

  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.accept());

  try {
    await showLoginIntro(page);
    await login(page);
    await showCaption(page, "Jackals VC — coach app walkthrough");

    await showCaption(page, "Dashboard — schedule, payments, and squad tools");
    await scrollSlow(page, 320);
    await scrollSlow(page, 320);

    const homeScreenButton = page.getByRole("button", {
      name: /Add to Home Screen|Install App/i,
    });
    if (await homeScreenButton.isVisible().catch(() => false)) {
      await showCaption(
        page,
        "Add the app to your phone home screen for quick access",
      );
      await homeScreenButton.click();
      await pause(page);
    }

    await page.goto(`${BASE_URL}/training?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await showCaption(
      page,
      "Training — see your squads, head vs cover role, and sign up each week",
    );
    await scrollSlow(page, 260);

    const firstSession = page.locator('a[href*="/training/session/"]').first();
    if (await firstSession.isVisible().catch(() => false)) {
      await showCaption(page, "Open a session to respond and view player sign-ups");
      await firstSession.click();
      await page.waitForLoadState("networkidle");
      await scrollSlow(page, 360);
      const attendButton = page.getByRole("button", { name: /^Attend$/i });
      if (await attendButton.isVisible().catch(() => false)) {
        await showCaption(page, "Tap Attend or Can't attend so your squad knows");
        await pause(page);
      }
    }

    await page.goto(`${BASE_URL}/matches?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await showCaption(page, "Matches — same sign-up flow as training");
    await scrollSlow(page, 260);

    const firstMatch = page.locator('a[href^="/matches/"]').first();
    if (await firstMatch.isVisible().catch(() => false)) {
      await showCaption(page, "Open a match for details and your availability");
      await firstMatch.click();
      await page.waitForLoadState("networkidle");
      await scrollSlow(page, 320);
    }

    await page.goto(`${BASE_URL}/payments?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await showCaption(
      page,
      "Payments — monthly coach fees and club confirmation screenshots",
    );
    await scrollSlow(page, 420);

    await page.goto(`${BASE_URL}/coach/training?team=DIV2_MENS`, {
      waitUntil: "networkidle",
    });
    await showCaption(
      page,
      "Squad management — edit weekly training times for your team",
    );
    await scrollSlow(page, 420);

    await page.goto(`${BASE_URL}/coach/matches?team=DIV2_MENS`, {
      waitUntil: "networkidle",
    });
    await showCaption(page, "Add or edit match fixtures for your squad");
    await scrollSlow(page, 320);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await showCaption(page, "You're set — use Dashboard anytime to stay on top");
    await pause(page, 2000);
  } finally {
    await context.close();
    await browser.close();
  }

  const webmFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith(".webm"))
    .map((file) => ({
      file,
      mtime: fs.statSync(path.join(OUTPUT_DIR, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (webmFiles.length === 0) {
    throw new Error("No Playwright video file was created.");
  }

  const sourceWebm = path.join(OUTPUT_DIR, webmFiles[0]!.file);
  const targetWebm = path.join(OUTPUT_DIR, "coach-app-demo.webm");
  fs.renameSync(sourceWebm, targetWebm);

  const targetMp4 = path.join(OUTPUT_DIR, "coach-app-demo.mp4");
  try {
    execSync(
      `ffmpeg -y -i "${targetWebm}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${targetMp4}"`,
      { stdio: "inherit" },
    );
    console.log(`MP4 saved: ${targetMp4}`);
  } catch {
    console.warn("ffmpeg conversion skipped — WEBM is available.");
  }

  console.log(`Video saved: ${targetWebm}`);
  console.log(`Login used: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
