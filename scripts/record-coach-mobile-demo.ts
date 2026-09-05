/**
 * Record a mobile coach app tutorial with Playwright.
 *
 *   npm run demo:coach-mobile:setup
 *   npm run dev   (port 3005)
 *   npm run demo:coach-mobile:record
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices, type Locator, type Page } from "playwright";

const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3005";
const DEMO_EMAIL = process.env.COACH_DEMO_EMAIL ?? "coach.demo@jackalsvc.com";
const DEMO_PASSWORD = process.env.COACH_DEMO_PASSWORD ?? "coachdemo123";
const OUTPUT_DIR = path.join(process.cwd(), "docs/coach-mobile-demo");
const PAUSE_MS = Number(process.env.DEMO_STEP_PAUSE_MS ?? "4800");
const TOTAL_STEPS = 13;

/** Viewport must match recordVideo size exactly — mismatches cause letterboxing. */
const VIEWPORT = { width: 390, height: 844 };
const COMPACT_CAPTION_H = 52;

type StepOptions = {
  step: number;
  title: string;
  body?: string;
};

async function wait(page: Page, ms = PAUSE_MS) {
  await page.waitForTimeout(ms);
}

async function injectRecordingStyles(page: Page) {
  await page.addInitScript(() => {
    const hideDevUi = () => {
      document.querySelectorAll("nextjs-portal").forEach((el) => {
        const node = el as HTMLElement;
        node.style.display = "none";
        node.style.visibility = "hidden";
        node.style.pointerEvents = "none";
      });
    };

    const apply = () => {
      document.documentElement.style.margin = "0";
      document.documentElement.style.background = "#09090b";
      document.body.style.margin = "0";
      document.body.style.minHeight = "100vh";
      document.body.style.background = "#09090b";
      document.body.style.overflowX = "hidden";
      hideDevUi();
    };

    apply();
    window.setInterval(hideDevUi, 50);
  });
}

async function hideDevUi(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => {
      const node = el as HTMLElement;
      node.style.display = "none";
      node.style.visibility = "hidden";
      node.style.pointerEvents = "none";
    });
  });
}

async function hideDemoChrome(page: Page) {
  await page.evaluate(() => {
    document.getElementById("coach-demo-overlay")?.remove();
    document.getElementById("coach-demo-highlight")?.remove();
  });
}

/** Full-width narration card — shown alone, never while highlighting. */
async function narrate(page: Page, { step, title, body }: StepOptions, ms = 3200) {
  await hideDemoChrome(page);
  await page.evaluate(
    ({ step, total, title, body }) => {
      document.getElementById("coach-demo-overlay")?.remove();
      const root = document.createElement("div");
      root.id = "coach-demo-overlay";
      root.innerHTML = `
        <div style="
          position:fixed;left:0;right:0;bottom:0;z-index:99990;
          pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          padding:0 10px calc(10px + env(safe-area-inset-bottom,0px));
        ">
          <div style="
            padding:12px 14px;border-radius:14px;
            background:rgba(10,10,14,0.96);border:1px solid rgba(255,255,255,0.1);
          ">
            <div style="
              display:inline-flex;margin-bottom:5px;padding:2px 8px;border-radius:999px;
              background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.35);
              color:#fecaca;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
            ">Step ${step} of ${total}</div>
            <p style="margin:0;color:#fff;font-size:14px;font-weight:700;line-height:1.25;">${title}</p>
            ${
              body
                ? `<p style="margin:5px 0 0;color:#a1a1aa;font-size:11px;line-height:1.4;">${body}</p>`
                : ""
            }
          </div>
        </div>
      `;
      document.body.appendChild(root);
    },
    { step, total: TOTAL_STEPS, title, body: body ?? "" },
  );
  await page.waitForTimeout(ms);
  await hideDemoChrome(page);
}

/** One-line caption at the bottom while an element is highlighted above it. */
async function showCompactCaption(page: Page, step: number, title: string) {
  await hideDevUi(page);
  await page.evaluate(
    ({ step, total, title, captionH }) => {
      document.getElementById("coach-demo-overlay")?.remove();
      const root = document.createElement("div");
      root.id = "coach-demo-overlay";
      root.innerHTML = `
        <div style="
          position:fixed;left:0;right:0;bottom:0;z-index:100000;height:${captionH}px;
          pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          display:flex;align-items:center;padding:0 14px 0 16px;
          background:linear-gradient(to top,rgba(9,9,11,0.98) 75%,transparent);
        ">
          <span style="
            flex-shrink:0;margin-right:8px;padding:2px 7px;border-radius:999px;
            background:rgba(239,68,68,0.2);color:#fecaca;font-size:9px;font-weight:700;
          ">${step}/${total}</span>
          <span style="color:#fff;font-size:12px;font-weight:600;line-height:1.2;">${title}</span>
        </div>
      `;
      document.body.appendChild(root);
    },
    { step, total: TOTAL_STEPS, title, captionH: COMPACT_CAPTION_H },
  );
}

async function dismissOverlays(page: Page) {
  const close = page.locator('button[aria-label="Close"]');
  if (await close.first().isVisible().catch(() => false)) {
    await close.first().click().catch(() => undefined);
    await page.waitForTimeout(500);
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

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
}

/** Centre the target in the area above the compact caption bar. */
async function scrollToFocus(page: Page, locator: Locator, reservedBottom = COMPACT_CAPTION_H) {
  const handle = await locator.first().elementHandle().catch(() => null);
  if (!handle) return;

  await page.evaluate(
    ({ el, reservedBottom, viewportH }) => {
      const node = el as HTMLElement;
      const rect = node.getBoundingClientRect();
      const focusBandTop = 48;
      const focusBandBottom = viewportH - reservedBottom - 12;
      const focusCentre = (focusBandTop + focusBandBottom) / 2;
      const elementCentre = rect.top + rect.height / 2;
      const delta = elementCentre - focusCentre;
      window.scrollBy({ top: delta, behavior: "smooth" });
    },
    { el: handle, reservedBottom, viewportH: VIEWPORT.height },
  );
  await page.waitForTimeout(1200);
}

async function highlightLocator(page: Page, locator: Locator) {
  const box = await locator.first().boundingBox().catch(() => null);
  if (!box) return;

  await page.evaluate(
    ({ rect, captionH, viewportH }) => {
      document.getElementById("coach-demo-highlight")?.remove();
      const ring = document.createElement("div");
      ring.id = "coach-demo-highlight";

      const pad = 5;
      let top = rect.y - pad;
      let height = rect.height + pad * 2;

      const maxBottom = viewportH - captionH - 16;
      if (top + height > maxBottom) {
        height = Math.max(24, maxBottom - top);
      }
      if (top < 8) {
        height = Math.max(24, height - (8 - top));
        top = 8;
      }

      ring.setAttribute(
        "style",
        [
          "position:fixed",
          `left:${Math.max(4, rect.x - pad)}px`,
          `top:${top}px`,
          `width:${rect.width + pad * 2}px`,
          `height:${height}px`,
          "border:3px solid #fbbf24",
          "border-radius:10px",
          "box-shadow:0 0 0 1px rgba(0,0,0,0.4),0 0 16px rgba(251,191,36,0.55)",
          "z-index:99999",
          "pointer-events:none",
        ].join(";"),
      );
      document.body.appendChild(ring);
    },
    { rect: box, captionH: COMPACT_CAPTION_H, viewportH: VIEWPORT.height },
  );
}

async function focus(
  page: Page,
  locator: Locator,
  step: number,
  title: string,
  holdMs = PAUSE_MS,
) {
  await hideDemoChrome(page);
  await hideDevUi(page);
  await scrollToFocus(page, locator);
  await showCompactCaption(page, step, title);
  await highlightLocator(page, locator);
  await page.waitForTimeout(holdMs);
  await hideDemoChrome(page);
}

async function tap(page: Page, locator: Locator) {
  await scrollToFocus(page, locator);
  await highlightLocator(page, locator);
  await page.waitForTimeout(700);
  await hideDemoChrome(page);
  await locator.first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(800);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    screen: VIEWPORT,
    userAgent: devices["iPhone 14 Pro"].userAgent,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT },
    locale: "en-IE",
    timezoneId: "Europe/Dublin",
    colorScheme: "dark",
  });

  const page = await context.newPage();
  await injectRecordingStyles(page);
  page.on("dialog", (dialog) => dialog.accept());

  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await authenticateSession(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await hideDevUi(page);
    await dismissOverlays(page);
    await scrollToTop(page);

    await narrate(page, {
      step: 1,
      title: "Coach app tutorial",
      body: "Sign in at jackalsvolleyball.com with the email and password the club gave you.",
    });

    await narrate(page, {
      step: 2,
      title: "Your dashboard",
      body: "Training, matches, payments, and squad tools are all here.",
    });
    await focus(
      page,
      page.getByRole("heading", { name: "Squad management" }),
      2,
      "Squad management",
    );

    const homeBtn = page.getByRole("button", {
      name: /Add to Home Screen|Install App/i,
    });
    if (await homeBtn.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 3,
        title: "Save to your phone",
        body: "Tap Add to Home Screen so the app opens like any other app.",
      });
      await focus(page, homeBtn, 3, "Add to Home Screen");
      await homeBtn.click().catch(() => undefined);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    }

    await page.goto(`${BASE_URL}/training?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await hideDevUi(page);
    await scrollToTop(page);

    await narrate(page, {
      step: 4,
      title: "Your squads",
      body: "All teams lists every squad you coach. Head coach · Cover coach shows your role.",
    });
    await focus(
      page,
      page.getByRole("navigation", { name: "Filter by team" }),
      4,
      "Head coach · Cover coach",
    );

    const d2mFilter = page.getByRole("button", { name: /Division 2 Mens/i });
    if (await d2mFilter.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 5,
        title: "Head coach squad",
        body: "Division 2 Mens — you respond first and can edit the schedule.",
      });
      await tap(page, d2mFilter);
      await scrollToTop(page);
    }

    const sessionLink = page.locator('a[href*="/training/session/"]').first();
    if (await sessionLink.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 6,
        title: "Training sign-up",
        body: "Open a session and tap Attend or Can't attend each week.",
      });
      await tap(page, sessionLink);
      await scrollToTop(page);

      await narrate(page, {
        step: 6,
        title: "Your response",
        body: "As head coach you can respond straight away.",
      });
      const attendBtn = page.getByRole("button", { name: /^Attend$/i });
      if (await attendBtn.isVisible().catch(() => false)) {
        await focus(page, attendBtn, 6, "Tap Attend");
      }

      await narrate(page, {
        step: 7,
        title: "See who's coming",
        body: "Counts for attending, not attending, and unanswered.",
      });
      await focus(
        page,
        page.getByRole("heading", { name: "Player summary" }),
        7,
        "Player summary",
      );

      await narrate(page, {
        step: 8,
        title: "Player attendance",
        body: "Each player's response is listed here.",
      });
      await focus(
        page,
        page.getByText("Player responses"),
        8,
        "Player responses",
      );

      const attendingGroup = page.getByText("Attending", { exact: true }).first();
      if (await attendingGroup.isVisible().catch(() => false)) {
        await focus(page, attendingGroup, 8, "Who's attending");
      }
    }

    await page.goto(`${BASE_URL}/training?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await hideDevUi(page);
    await scrollToTop(page);

    const d3wFilter = page.getByRole("button", { name: /Division 3 Womens/i });
    if (await d3wFilter.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 9,
        title: "Cover coach priority",
        body: "On D3 Womens you wait until the head coach responds first.",
      });
      await tap(page, d3wFilter);

      const d3wSession = page.locator('a[href*="/training/session/"]').first();
      if (await d3wSession.isVisible().catch(() => false)) {
        await tap(page, d3wSession);
        await scrollToTop(page);

        const waitingText = page.getByText(/head coach/i).first();
        await narrate(page, {
          step: 9,
          title: "Waiting for head coach",
          body: "Cover coaches see this until the head coach accepts or declines.",
        });
        await focus(page, waitingText, 9, "Head coach responds first");
      }
    }

    await page.goto(`${BASE_URL}/matches?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await hideDevUi(page);
    await scrollToTop(page);

    await narrate(page, {
      step: 10,
      title: "Match sign-ups",
      body: "See who's playing and respond for yourself.",
    });

    const matchLink = page.locator('a[href^="/matches/"]').first();
    if (await matchLink.isVisible().catch(() => false)) {
      await tap(page, matchLink);
      await scrollToTop(page);

      await narrate(page, {
        step: 10,
        title: "Match player responses",
        body: "See which players are available.",
      });
      await focus(
        page,
        page.getByText("Player responses"),
        10,
        "Player responses",
      );
    }

    const matchdayBtn = page.getByRole("link", { name: /Matchday VLY sheet/i });
    if (await matchdayBtn.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 11,
        title: "Matchday VLY sheet",
        body: "Download VLY membership cards for referees on match day.",
      });
      await focus(page, matchdayBtn, 11, "Matchday VLY sheet");
      await tap(page, matchdayBtn);
      await scrollToTop(page);

      const downloadBtn = page.getByRole("link", { name: /Download sheet/i });
      if (await downloadBtn.isVisible().catch(() => false)) {
        await narrate(page, {
          step: 11,
          title: "VLY cards for referees",
          body: "Each attending player with photo and number. Download or print.",
        });
        await focus(page, downloadBtn, 11, "Download sheet");
      }
    }

    await page.goto(`${BASE_URL}/payments?from=dashboard`, {
      waitUntil: "networkidle",
    });
    await hideDevUi(page);
    await scrollToTop(page);

    await narrate(page, {
      step: 12,
      title: "Coach payments",
      body: "Check your monthly total and paid sessions here.",
    });
    await focus(
      page,
      page.getByRole("heading", { name: "Payments" }),
      12,
      "Payments",
    );

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await scrollToTop(page);
    await narrate(page, {
      step: 13,
      title: "You're all set",
      body: "Sign in each week for training and matches. Questions? Message the club admin.",
    }, 3500);
  } finally {
    await hideDemoChrome(page);
    await context.close();
    await browser.close();
  }

  const webmFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".webm") && !f.startsWith("coach-app-demo"))
    .map((f) => ({ f, m: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);

  if (webmFiles.length === 0) {
    throw new Error("No Playwright video file was created.");
  }

  const sourceWebm = path.join(OUTPUT_DIR, webmFiles[0]!.f);
  const targetWebm = path.join(OUTPUT_DIR, "coach-app-demo.webm");
  const targetMp4 = path.join(OUTPUT_DIR, "coach-app-demo.mp4");
  if (fs.existsSync(targetWebm)) fs.unlinkSync(targetWebm);
  if (fs.existsSync(targetMp4)) fs.unlinkSync(targetMp4);
  fs.renameSync(sourceWebm, targetWebm);

  execSync(
    [
      "ffmpeg -y",
      `-i "${targetWebm}"`,
      `-vf "scale=${VIEWPORT.width}:${VIEWPORT.height}:force_original_aspect_ratio=increase,crop=${VIEWPORT.width}:${VIEWPORT.height}"`,
      "-c:v libx264 -pix_fmt yuv420p -movflags +faststart",
      `"${targetMp4}"`,
    ].join(" "),
    { stdio: "inherit" },
  );

  console.log(`Saved: ${targetMp4}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
