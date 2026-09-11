/**
 * Record a polished mobile member-app tutorial with Playwright.
 *
 * Covers: login, dashboard, training, matches, fixtures, membership,
 * merch, gallery, videos, events, profile, and install.
 *
 *   npm run demo:member-tutorial:setup
 *   npm run demo:member-tutorial:record
 *
 * Requires local demo data + `npm run dev` on port 3005.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices, type Locator, type Page } from "playwright";

const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3005";
const DEMO_EMAIL = process.env.MEMBER_DEMO_EMAIL ?? "demo.dashboard@jackalsvc.com";
const DEMO_PASSWORD =
  process.env.MEMBER_DEMO_PASSWORD ?? "DemoDash123!";
const OUTPUT_DIR = path.join(process.cwd(), "docs/member-app-tutorial");
const PAUSE_MS = Number(process.env.DEMO_STEP_PAUSE_MS ?? "4200");
const TOTAL_STEPS = 16;

const VIEWPORT = { width: 390, height: 844 };
const COMPACT_CAPTION_H = 64;

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
      document.querySelectorAll('[role="dialog"]').forEach((el) => {
        const node = el as HTMLElement;
        // Keep login form usable; hide blocking marketing/install modals only.
        const title = node.getAttribute("aria-labelledby");
        const labelled = title ? document.getElementById(title)?.textContent ?? "" : "";
        if (/cookie|install|home screen|notification|subscribe|welcome/i.test(labelled + node.textContent)) {
          node.style.display = "none";
          const wrap = node.closest(".fixed.inset-0");
          if (wrap) (wrap as HTMLElement).style.display = "none";
        }
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
    document.getElementById("member-demo-overlay")?.remove();
    document.getElementById("member-demo-highlight")?.remove();
    document.getElementById("member-demo-titlecard")?.remove();
  });
}

async function titleCard(
  page: Page,
  {
    eyebrow,
    title,
    body,
  }: { eyebrow: string; title: string; body: string },
  ms = 4200,
) {
  await hideDemoChrome(page);
  await page.evaluate(
    ({ eyebrow, title, body }) => {
      const root = document.createElement("div");
      root.id = "member-demo-titlecard";
      root.innerHTML = `
        <div style="
          position:fixed;inset:0;z-index:100010;pointer-events:none;
          display:flex;align-items:center;justify-content:center;
          padding:28px;background:
            radial-gradient(ellipse 80% 50% at 50% 0%,rgba(232,34,42,0.28),transparent 60%),
            linear-gradient(180deg,#0a0a0d 0%,#121216 100%);
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        ">
          <div style="max-width:320px;text-align:center;">
            <div style="
              display:inline-flex;margin-bottom:14px;padding:5px 12px;border-radius:999px;
              background:rgba(232,34,42,0.18);border:1px solid rgba(232,34,42,0.4);
              color:#fecaca;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
            ">${eyebrow}</div>
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;">
              ${title}
            </h1>
            <p style="margin:14px 0 0;color:#a1a1aa;font-size:15px;line-height:1.45;">
              ${body}
            </p>
          </div>
        </div>
      `;
      document.body.appendChild(root);
    },
    { eyebrow, title, body },
  );
  await page.waitForTimeout(ms);
  await hideDemoChrome(page);
}

/** Large narration card — easy to read on phone screens. */
async function narrate(page: Page, { step, title, body }: StepOptions, ms = 3600) {
  await hideDemoChrome(page);
  await page.evaluate(
    ({ step, total, title, body }) => {
      const root = document.createElement("div");
      root.id = "member-demo-overlay";
      root.innerHTML = `
        <div style="
          position:fixed;left:0;right:0;bottom:0;z-index:99990;pointer-events:none;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          padding:0 12px calc(14px + env(safe-area-inset-bottom,0px));
        ">
          <div style="
            padding:16px 16px 18px;border-radius:18px;
            background:rgba(8,8,12,0.97);border:1px solid rgba(255,255,255,0.14);
            box-shadow:0 -8px 40px rgba(0,0,0,0.55);
          ">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="
                padding:3px 9px;border-radius:999px;
                background:rgba(232,34,42,0.2);border:1px solid rgba(232,34,42,0.4);
                color:#fecaca;font-size:11px;font-weight:800;letter-spacing:0.04em;
              ">Step ${step} of ${total}</span>
              <span style="flex:1;height:4px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;">
                <span style="display:block;height:100%;width:${(step / total) * 100}%;background:#e8222a;border-radius:999px;"></span>
              </span>
            </div>
            <p style="margin:0;color:#fff;font-size:17px;font-weight:800;line-height:1.25;letter-spacing:-0.01em;">
              ${title}
            </p>
            ${
              body
                ? `<p style="margin:8px 0 0;color:#d4d4d8;font-size:14px;line-height:1.45;font-weight:500;">${body}</p>`
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

async function showCompactCaption(page: Page, step: number, title: string) {
  await hideDevUi(page);
  await page.evaluate(
    ({ step, total, title, captionH }) => {
      document.getElementById("member-demo-overlay")?.remove();
      const root = document.createElement("div");
      root.id = "member-demo-overlay";
      root.innerHTML = `
        <div style="
          position:fixed;left:0;right:0;bottom:0;z-index:100000;height:${captionH}px;
          pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          display:flex;align-items:center;gap:10px;padding:0 14px 8px;
          background:linear-gradient(to top,rgba(9,9,11,0.98) 70%,transparent);
        ">
          <span style="
            flex-shrink:0;padding:4px 9px;border-radius:999px;
            background:rgba(232,34,42,0.22);color:#fecaca;font-size:11px;font-weight:800;
          ">${step}/${total}</span>
          <span style="color:#fff;font-size:14px;font-weight:700;line-height:1.25;">${title}</span>
        </div>
      `;
      document.body.appendChild(root);
    },
    { step, total: TOTAL_STEPS, title, captionH: COMPACT_CAPTION_H },
  );
}

async function dismissOverlays(page: Page) {
  for (let i = 0; i < 5; i += 1) {
    const close = page.locator(
      'button[aria-label="Close"], button:has-text("Close"), button:has-text("Not now"), button:has-text("Maybe later"), [role="dialog"] button',
    );
    if (await close.first().isVisible().catch(() => false)) {
      await close.first().click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(400);
    } else {
      break;
    }
  }
  // Force-remove leftover modal layers that can block clicks during recording.
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .fixed.inset-0.z-999').forEach((el) => {
      (el as HTMLElement).style.display = "none";
      el.remove();
    });
  });
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(350);
}

async function scrollToFocus(
  page: Page,
  locator: Locator,
  reservedBottom = COMPACT_CAPTION_H,
) {
  const handle = await locator.first().elementHandle().catch(() => null);
  if (!handle) return;

  await page.evaluate(
    ({ el, reservedBottom, viewportH }) => {
      const node = el as HTMLElement;
      const rect = node.getBoundingClientRect();
      const focusBandTop = 56;
      const focusBandBottom = viewportH - reservedBottom - 12;
      const focusCentre = (focusBandTop + focusBandBottom) / 2;
      const elementCentre = rect.top + rect.height / 2;
      window.scrollBy({ top: elementCentre - focusCentre, behavior: "smooth" });
    },
    { el: handle, reservedBottom, viewportH: VIEWPORT.height },
  );
  await page.waitForTimeout(1100);
}

async function highlightLocator(page: Page, locator: Locator) {
  const box = await locator.first().boundingBox().catch(() => null);
  if (!box) return;

  await page.evaluate(
    ({ rect, captionH, viewportH }) => {
      document.getElementById("member-demo-highlight")?.remove();
      const ring = document.createElement("div");
      ring.id = "member-demo-highlight";

      const pad = 6;
      let top = rect.y - pad;
      let height = rect.height + pad * 2;
      const maxBottom = viewportH - captionH - 12;
      if (top + height > maxBottom) height = Math.max(28, maxBottom - top);
      if (top < 8) {
        height = Math.max(28, height - (8 - top));
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
          "border-radius:12px",
          "box-shadow:0 0 0 1px rgba(0,0,0,0.45),0 0 18px rgba(251,191,36,0.5)",
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
  if (!(await locator.first().isVisible().catch(() => false))) return;
  await hideDemoChrome(page);
  await hideDevUi(page);
  await scrollToFocus(page, locator);
  await showCompactCaption(page, step, title);
  await highlightLocator(page, locator);
  await page.waitForTimeout(holdMs);
  await hideDemoChrome(page);
}

async function tap(page: Page, locator: Locator) {
  if (!(await locator.first().isVisible().catch(() => false))) return false;
  await scrollToFocus(page, locator);
  await highlightLocator(page, locator);
  await page.waitForTimeout(650);
  await hideDemoChrome(page);
  await locator.first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(700);
  return true;
}

async function gotoSafe(page: Page, pathName: string) {
  await page.goto(`${BASE_URL}${pathName}`, { waitUntil: "networkidle" });
  await hideDevUi(page);
  await dismissOverlays(page);
  await scrollToTop(page);
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
    // —— 1. Login ——
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await hideDevUi(page);
    await dismissOverlays(page);
    await titleCard(page, {
      eyebrow: "Jackals Volleyball Club",
      title: "Member app guide",
      body: "A calm walkthrough of everything in your member account — easy steps, nothing missed.",
    });
    await dismissOverlays(page);

    await narrate(page, {
      step: 1,
      title: "Sign in",
      body: "Open jackalsvolleyball.com → Members Only. Use the email and temporary password the club sent you.",
    });
    await dismissOverlays(page);

    // Visual login fill (best-effort) — overlays must never stop the recording.
    try {
      await dismissOverlays(page);
      const emailInput = page.locator("#email, input[type='email']").first();
      const passwordInput = page.locator("#password, input[type='password']").first();
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await focus(page, emailInput, 1, "Enter your email", 1800);
        await emailInput.fill(DEMO_EMAIL, { timeout: 5000 });
        await wait(page, 500);
      }
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await focus(page, passwordInput, 1, "Enter your password", 1800);
        await passwordInput.fill(DEMO_PASSWORD, { timeout: 5000 });
        await wait(page, 500);
        const signIn = page.getByRole("button", { name: /sign in/i }).first();
        if (await signIn.isVisible().catch(() => false)) {
          await focus(page, signIn, 1, "Tap Sign in", 1600);
        }
      }
    } catch {
      // Continue with session API login below.
    }

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
    await gotoSafe(page, "/dashboard");

    await dismissOverlays(page);
    await gotoSafe(page, "/dashboard");

    // —— 2. Dashboard ——
    await narrate(page, {
      step: 2,
      title: "Your dashboard",
      body: "This is home. Training, matches, events, videos, membership, and shortcuts live here.",
    });
    await focus(
      page,
      page.getByRole("heading", { name: /welcome|training|dashboard/i }).first(),
      2,
      "Welcome to your home screen",
    );

    await narrate(page, {
      step: 3,
      title: "Training & Matches",
      body: "Yellow = reply needed. Green = you’re attending. Tap a row to respond.",
    });
    await focus(
      page,
      page.getByRole("heading", { name: /^Training$/i }).first(),
      3,
      "Training panel",
      3200,
    );
    await focus(
      page,
      page.getByRole("heading", { name: /^Matches$/i }).first(),
      3,
      "Matches panel",
      3200,
    );

    await narrate(page, {
      step: 4,
      title: "Events, videos & links",
      body: "Club events, squad video playlists, plus Fixtures, Merch, and Gallery shortcuts.",
    });
    await focus(
      page,
      page.getByRole("heading", { name: /^Events$/i }).first(),
      4,
      "Club events",
      2800,
    );
    await focus(
      page,
      page.getByRole("heading", { name: /^Videos$/i }).first(),
      4,
      "Squad video library",
      2800,
    );
    await focus(
      page,
      page.getByRole("heading", { name: /^Links$/i }).first(),
      4,
      "Quick links",
      2800,
    );

    // —— 5. Training RSVP ——
    await narrate(page, {
      step: 5,
      title: "Reply to training",
      body: "Open Training → pick a session → Attend or Can’t attend.",
    });
    const trainingViewAll = page
      .locator('a[href*="/training"]')
      .filter({ hasText: /view all|all training/i })
      .first();
    if (await trainingViewAll.isVisible().catch(() => false)) {
      await tap(page, trainingViewAll);
    } else {
      await gotoSafe(page, "/training?from=dashboard");
    }
    await scrollToTop(page);
    await narrate(page, {
      step: 5,
      title: "Your training month",
      body: "Browse by month. Sessions that need a reply are highlighted.",
    });
    const sessionLink = page.locator('a[href*="/training/session/"]').first();
    if (await sessionLink.isVisible().catch(() => false)) {
      await tap(page, sessionLink);
      await scrollToTop(page);
      await narrate(page, {
        step: 5,
        title: "Confirm availability",
        body: "Tap Attend if you’re coming, or Can’t attend if you’re not.",
      });
      const attendBtn = page.getByRole("button", { name: /^Attend$/i });
      const cantBtn = page.getByRole("button", { name: /can.?t attend|not attending/i });
      if (await attendBtn.isVisible().catch(() => false)) {
        await focus(page, attendBtn, 5, "Tap Attend", 3500);
      } else if (await cantBtn.isVisible().catch(() => false)) {
        await focus(page, cantBtn, 5, "Or Can’t attend", 3500);
      }
    }

    // —— 6. Matches ——
    await narrate(page, {
      step: 6,
      title: "Reply to matches",
      body: "Same idea for fixtures — open Matches and confirm you’re available.",
    });
    await gotoSafe(page, "/matches?from=dashboard");
    await narrate(page, {
      step: 6,
      title: "Match schedule",
      body: "Times shown are warm-up times so you know when to arrive.",
    });
    const matchLink = page.locator('a[href^="/matches/"]').first();
    if (await matchLink.isVisible().catch(() => false)) {
      await tap(page, matchLink);
      await scrollToTop(page);
      await narrate(page, {
        step: 6,
        title: "Match response",
        body: "Confirm attending so coaches can set the lineup.",
      });
      const matchAttend = page.getByRole("button", { name: /^Attend$/i });
      if (await matchAttend.isVisible().catch(() => false)) {
        await focus(page, matchAttend, 6, "Tap Attend for the match", 3500);
      }
    }

    // —— 7. Season fixtures ——
    await narrate(page, {
      step: 7,
      title: "Season fixtures",
      body: "Full-year schedule for every squad. Filter by team or view All teams.",
    });
    await gotoSafe(page, "/fixtures?team=all&from=dashboard");
    await focus(
      page,
      page.getByRole("navigation", { name: /filter fixtures by team/i }),
      7,
      "Tap a squad or All teams",
      4000,
    );

    // —— 8. Membership ——
    await narrate(page, {
      step: 8,
      title: "Membership & payments",
      body: "See your plan, what’s paid, and what’s due next.",
    });
    await gotoSafe(page, "/membership?from=dashboard");
    await focus(
      page,
      page.getByRole("heading", { name: /membership|payment|plan/i }).first(),
      8,
      "Your membership status",
      3800,
    );

    // —— 9. Merch ——
    await narrate(page, {
      step: 9,
      title: "Club merch",
      body: "Order kit and club merchandise from Merch when orders are open.",
    });
    await gotoSafe(page, "/merchandise-order?from=dashboard");
    await focus(
      page,
      page.getByRole("heading", { name: /merch|merchandise|order|kit/i }).first(),
      9,
      "Merchandise orders",
      3600,
    );

    // —— 10. Gallery ——
    await narrate(page, {
      step: 10,
      title: "Club gallery",
      body: "Browse match, training, and social photo albums.",
    });
    await gotoSafe(page, "/gallery?from=dashboard");
    await focus(
      page,
      page.getByRole("heading", { name: /gallery|club/i }).first(),
      10,
      "Photo albums",
      3400,
    );
    const album = page.locator('a[href*="/gallery/"]').first();
    if (await album.isVisible().catch(() => false)) {
      await tap(page, album);
      await wait(page, 2000);
    }

    // —— 11. Videos ——
    await narrate(page, {
      step: 11,
      title: "Video library",
      body: "From the dashboard Videos panel, open Training clips or Match footage on YouTube.",
    });
    await gotoSafe(page, "/dashboard");
    await focus(
      page,
      page.getByRole("heading", { name: /^Videos$/i }).first(),
      11,
      "Open playlists from here",
      3800,
    );

    // —— 12. Events ——
    await narrate(page, {
      step: 12,
      title: "Club events",
      body: "Fun sessions, clinics, and socials — browse and open any event for details.",
    });
    await gotoSafe(page, "/events?from=dashboard");
    await focus(
      page,
      page.getByRole("heading", { name: /events|fun|what.?s on/i }).first(),
      12,
      "What’s on at the club",
      3600,
    );

    // —— 13. Profile ——
    await narrate(page, {
      step: 13,
      title: "Your profile",
      body: "Update email, password, matchday details, and newsletter preferences.",
    });
    await gotoSafe(page, "/profile");
    await focus(
      page,
      page.getByRole("heading", { name: /your profile/i }),
      13,
      "Profile overview",
      3000,
    );
    await focus(
      page,
      page.getByText(/^Password$/i).first(),
      13,
      "Change your password here",
      3200,
    );
    await focus(
      page,
      page.getByText(/email|newsletter|matchday|VLY/i).first(),
      13,
      "Email, matchday info & newsletter",
      3400,
    );

    // —— 14. Navigation ——
    await narrate(page, {
      step: 14,
      title: "Find everything in the menu",
      body: "Use Members Only / the menu for Dashboard, Trainings, Matches, Membership, and more.",
    });
    await gotoSafe(page, "/dashboard");
    const menuBtn = page
      .getByRole("button", { name: /menu|open|more|members/i })
      .or(page.locator('button[aria-label*="Menu" i]'))
      .first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await focus(page, menuBtn, 14, "Open the menu", 2800);
      await tap(page, menuBtn);
      await wait(page, 2500);
    }

    // —— 15. Install ——
    await gotoSafe(page, "/dashboard");
    const homeBtn = page.getByRole("button", {
      name: /Add to Home Screen|Install App/i,
    });
    if (await homeBtn.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 15,
        title: "Add to your phone",
        body: "Install the app so Jackals opens like a normal app icon.",
      });
      await focus(page, homeBtn, 15, "Add to Home Screen / Install App", 4000);
    } else {
      await narrate(page, {
        step: 15,
        title: "Add to your phone",
        body: "On iPhone: Share → Add to Home Screen. On Android: Install App when prompted.",
      });
    }

    // —— 16. Done ——
    await titleCard(
      page,
      {
        eyebrow: "You're ready",
        title: "That's everything",
        body: "Check the dashboard each week, reply to training & matches, and message admin if you need help.",
      },
      4800,
    );
  } finally {
    await hideDemoChrome(page).catch(() => undefined);
    await context.close();
    await browser.close();
  }

  const webmFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".webm") && !f.startsWith("member-app-tutorial"))
    .map((f) => ({ f, m: fs.statSync(path.join(OUTPUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);

  if (webmFiles.length === 0) {
    throw new Error("No Playwright video file was created.");
  }

  const sourceWebm = path.join(OUTPUT_DIR, webmFiles[0]!.f);
  const targetWebm = path.join(OUTPUT_DIR, "member-app-tutorial.webm");
  const targetMp4 = path.join(OUTPUT_DIR, "member-app-tutorial.mp4");
  const musicPath = path.join(OUTPUT_DIR, "tutorial-ambient.m4a");
  const finalMp4 = path.join(OUTPUT_DIR, "member-app-tutorial-final.mp4");

  if (fs.existsSync(targetWebm)) fs.unlinkSync(targetWebm);
  if (fs.existsSync(targetMp4)) fs.unlinkSync(targetMp4);
  if (fs.existsSync(finalMp4)) fs.unlinkSync(finalMp4);
  fs.renameSync(sourceWebm, targetWebm);

  // Soft ambient pad (no copyrighted track) — quiet C-major drones with fade.
  execSync(
    [
      "ffmpeg -y",
      '-f lavfi -i "sine=frequency=130.81:duration=240"',
      '-f lavfi -i "sine=frequency=196.00:duration=240"',
      '-f lavfi -i "sine=frequency=261.63:duration=240"',
      '-f lavfi -i "anoisesrc=color=pink:amplitude=0.015:duration=240"',
      '-filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=longest,volume=0.09[pad];[3:a]lowpass=f=500,volume=0.04[noise];[pad][noise]amix=inputs=2:duration=longest,afade=t=in:st=0:d=4,afade=t=out:st=230:d=8[a]"',
      '-map "[a]" -c:a aac -b:a 128k',
      `"${musicPath}"`,
    ].join(" "),
    { stdio: "inherit" },
  );

  execSync(
    [
      "ffmpeg -y",
      `-i "${targetWebm}"`,
      `-vf "scale=${VIEWPORT.width}:${VIEWPORT.height}:force_original_aspect_ratio=increase,crop=${VIEWPORT.width}:${VIEWPORT.height}"`,
      "-c:v libx264 -pix_fmt yuv420p -movflags +faststart -an",
      `"${targetMp4}"`,
    ].join(" "),
    { stdio: "inherit" },
  );

  // Mix video + quiet music; trim music to video length.
  execSync(
    [
      "ffmpeg -y",
      `-i "${targetMp4}"`,
      `-i "${musicPath}"`,
      '-filter_complex "[1:a]volume=0.22[a]"',
      "-map 0:v -map \"[a]\" -c:v copy -c:a aac -shortest -movflags +faststart",
      `"${finalMp4}"`,
    ].join(" "),
    { stdio: "inherit" },
  );

  // Promote final as the shareable mp4.
  fs.renameSync(finalMp4, targetMp4);
  console.log(`Saved: ${targetMp4}`);
  console.log(`Also: ${targetWebm}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
