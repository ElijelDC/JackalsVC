/**
 * Record a polished mobile member-app tutorial with Playwright.
 *
 * Covers: Members Only login, install + notifications, dashboard reply colours,
 * training RSVP, match RSVP, fixtures, membership, merch, gallery, events,
 * profile, and menu.
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
const PUBLIC_DIR = path.join(process.cwd(), "public/tutorials");
/** Slightly snappier holds — readable captions without dead air. */
const PAUSE_MS = Number(process.env.DEMO_STEP_PAUSE_MS ?? "2100");
const TOTAL_STEPS = 12;

const VIEWPORT = { width: 390, height: 844 };
const COMPACT_CAPTION_H = 58;

type StepOptions = {
  step: number;
  title: string;
  body?: string;
};

async function wait(page: Page, ms = PAUSE_MS) {
  await page.waitForTimeout(ms);
}

function isProtectedAuthDialog(text: string) {
  return /members only|sign in with your email|member register|member-signin/i.test(
    text,
  );
}

async function injectRecordingStyles(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("jackals-event-newsletter-subscribed", "true");
      localStorage.setItem(
        "jackals-event-newsletter-overlay-snooze",
        String(Date.now()),
      );
    } catch {
      // ignore storage failures in private contexts
    }

    const hideDevUi = () => {
      document.querySelectorAll("nextjs-portal").forEach((el) => {
        const node = el as HTMLElement;
        node.style.display = "none";
        node.style.visibility = "hidden";
        node.style.pointerEvents = "none";
      });
      document.querySelectorAll(".fixed.inset-0.z-999").forEach((wrap) => {
        const text = wrap.textContent ?? "";
        if (/members only|sign in with your email|member register|member-signin/i.test(text)) {
          return;
        }
        // Hide blocking marketing overlays only — keep dashboard install cards.
        if (
          /cookie|subscribe|stay in the loop|welcome|event email|notify me/i.test(
            text,
          ) &&
          !/install jackals|add to home|notifications|members only|sign in with your email/i.test(
            text,
          )
        ) {
          (wrap as HTMLElement).style.display = "none";
          (wrap as HTMLElement).style.pointerEvents = "none";
          wrap.remove();
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
  ms = 2600,
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

async function narrate(page: Page, { step, title, body }: StepOptions, ms = 2000) {
  await hideDemoChrome(page);
  await page.evaluate(
    ({ step, total, title, body }) => {
      const root = document.createElement("div");
      root.id = "member-demo-overlay";
      root.innerHTML = `
        <div style="
          position:fixed;left:0;right:0;bottom:0;z-index:99990;pointer-events:none;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          padding:0 12px calc(12px + env(safe-area-inset-bottom,0px));
        ">
          <div style="
            padding:14px 16px 16px;border-radius:18px;
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
  for (let i = 0; i < 6; i += 1) {
    // Prefer explicit newsletter / marketing dismissals first.
    const notNow = page.getByRole("button", { name: /not now|maybe later|no thanks/i });
    if (await notNow.first().isVisible().catch(() => false)) {
      await notNow.first().click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(200);
      continue;
    }

    const dialogs = page.locator('[role="dialog"]');
    const count = await dialogs.count();
    let closed = false;
    for (let d = 0; d < count; d += 1) {
      const dialog = dialogs.nth(d);
      if (!(await dialog.isVisible().catch(() => false))) continue;
      const text = (await dialog.innerText().catch(() => "")) || "";
      if (isProtectedAuthDialog(text)) continue;
      if (/add to home screen/i.test(text) && !/stay in the loop|subscribe/i.test(text)) {
        continue;
      }
      const close = dialog.locator(
        'button[aria-label="Close"], button:has-text("Close"), button:has-text("Not now"), button:has-text("Maybe later")',
      );
      if (await close.first().isVisible().catch(() => false)) {
        await close.first().click({ force: true }).catch(() => undefined);
        closed = true;
        await page.waitForTimeout(200);
      }
    }
    if (!closed) break;
  }
  await page.evaluate(() => {
    document.querySelectorAll(".fixed.inset-0.z-999").forEach((el) => {
      const text = el.textContent ?? "";
      if (/members only|sign in with your email|member register|member-signin/i.test(text)) {
        return;
      }
      if (/install jackals|add to home screen|turn on notifications|enable notifications/i.test(text)) {
        return;
      }
      if (
        /cookie|subscribe|stay in the loop|event email|welcome|notify me/i.test(
          text,
        )
      ) {
        (el as HTMLElement).style.display = "none";
        (el as HTMLElement).style.pointerEvents = "none";
        el.remove();
      }
    });
  });
}

async function ensureMemberSession(page: Page) {
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
  const session = (await page.request
    .get(`${BASE_URL}/api/auth/session`)
    .then((r) => r.json())) as { user?: { email?: string } };
  if (!session?.user?.email) {
    throw new Error("Failed to establish demo member session for recording.");
  }
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(220);
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
  await page.waitForTimeout(650);
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
  options?: { scroll?: boolean },
) {
  if (!(await locator.first().isVisible().catch(() => false))) return;
  await hideDemoChrome(page);
  await hideDevUi(page);
  if (options?.scroll !== false) {
    await scrollToFocus(page, locator);
  }
  await showCompactCaption(page, step, title);
  await highlightLocator(page, locator);
  await page.waitForTimeout(holdMs);
  await hideDemoChrome(page);
}

async function tap(page: Page, locator: Locator) {
  if (!(await locator.first().isVisible().catch(() => false))) return false;
  await scrollToFocus(page, locator);
  await highlightLocator(page, locator);
  await page.waitForTimeout(350);
  await hideDemoChrome(page);
  await locator.first().click({ force: true });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(400);
  return true;
}

async function closeBlockingDialogs(page: Page) {
  for (let i = 0; i < 4; i += 1) {
    const dialog = page.locator('[role="dialog"]').first();
    if (!(await dialog.isVisible().catch(() => false))) break;
    const text = (await dialog.innerText().catch(() => "")) || "";
    if (isProtectedAuthDialog(text)) break;
    const close = dialog.locator(
      'button[aria-label="Close"], button:has-text("Close"), button:has-text("Done"), button:has-text("Not now")',
    );
    if (await close.first().isVisible().catch(() => false)) {
      await close.first().click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(300);
      continue;
    }
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(300);
  }
}

async function gotoSafe(page: Page, pathName: string) {
  await page.goto(`${BASE_URL}${pathName}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await hideDevUi(page);
  await dismissOverlays(page);
  await scrollToTop(page);
  // Avoid filming Next.js route loading skeletons.
  await page
    .locator("text=/Loading\\.\\.\\./i")
    .first()
    .waitFor({ state: "hidden", timeout: 8000 })
    .catch(() => undefined);
  await page.waitForTimeout(250);
}

async function openMemberLoginFromNav(page: Page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await hideDevUi(page);
  await dismissOverlays(page);
  await scrollToTop(page);

  const menuBtn = page.getByRole("button", { name: /open menu/i }).first();
  await menuBtn.waitFor({ state: "visible", timeout: 8000 });
  await showCompactCaption(page, 1, "Open the menu");
  await highlightLocator(page, menuBtn);
  await page.waitForTimeout(1000);
  await hideDemoChrome(page);
  await dismissOverlays(page);
  await menuBtn.click({ force: true });

  const mobileNav = page.locator("nav[aria-label='Mobile navigation']");
  await mobileNav.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(300);
  await dismissOverlays(page);

  const membersOnly = mobileNav.getByRole("button", { name: /members only/i });
  await membersOnly.waitFor({ state: "visible", timeout: 8000 });
  await showCompactCaption(page, 1, "Tap Members Only");
  await highlightLocator(page, membersOnly);
  await page.waitForTimeout(1200);
  await hideDemoChrome(page);
  await membersOnly.click({ force: true });

  const emailInput = page.locator("#member-signin-email");
  try {
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
  } catch {
    await page.goto(`${BASE_URL}/?auth=signin&callbackUrl=/dashboard`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await hideDevUi(page);
    await dismissOverlays(page);
    await emailInput.waitFor({ state: "visible", timeout: 8000 });
  }
  await dismissOverlays(page);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

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
    // —— Title ——
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await hideDevUi(page);
    await dismissOverlays(page);
    await titleCard(page, {
      eyebrow: "Jackals Volleyball Club",
      title: "Member app guide",
      body: "Everything you need in your member account — clear steps, nothing missed.",
    });

    // —— 1. Sign in ——
    await narrate(page, {
      step: 1,
      title: "Sign in",
      body: "Menu → Members Only. Use the email and temporary password the club sent you.",
    }, 1800);

    await openMemberLoginFromNav(page);

    const emailInput = page.locator("#member-signin-email");
    const passwordInput = page.locator("#member-signin-password");

    await focus(page, emailInput, 1, "Enter your email", 1000, { scroll: false });
    await emailInput.click({ force: true });
    await emailInput.fill("");
    await emailInput.pressSequentially(DEMO_EMAIL, { delay: 18 });
    await wait(page, 300);

    await focus(page, passwordInput, 1, "Enter your password", 1000, { scroll: false });
    await passwordInput.click({ force: true });
    await passwordInput.fill("");
    await passwordInput.pressSequentially(DEMO_PASSWORD, { delay: 18 });
    await wait(page, 300);

    const signIn = page.locator('form').filter({ has: page.locator("#member-signin-email") }).getByRole("button", { name: /^sign in$/i });
    await focus(page, signIn, 1, "Tap Sign in", 1100, { scroll: false });
    await signIn.click({ force: true });
    await page.waitForTimeout(1200);

    // Always establish a real session for the rest of the walkthrough.
    await ensureMemberSession(page);
    await gotoSafe(page, "/dashboard");
    // Clear any sticky auth query/modal from the login demo.
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.evaluate(() => {
      document.querySelectorAll(".fixed.inset-0.z-999").forEach((el) => {
        const text = el.textContent ?? "";
        if (/members only|sign in with your email|member register/i.test(text)) {
          el.remove();
        }
      });
    });
    await dismissOverlays(page);

    const dashboardReady = page.getByRole("heading", { name: /^Training$/i }).or(
      page.getByText(/Install Jackals WebApp/i),
    );
    await dashboardReady.first().waitFor({ state: "visible", timeout: 15000 });
    await scrollToTop(page);

    // —— 2. Install + notifications ——
    await narrate(page, {
      step: 2,
      title: "Install the club app",
      body: "Add Jackals to your Home Screen — required this season for training, matches, and updates.",
    }, 1900);

    const installCard = page.getByText(/Install Jackals WebApp/i).first();
    if (await installCard.isVisible().catch(() => false)) {
      await focus(page, installCard, 2, "Install is mandatory this season", 2000);
      const installCta = page.getByRole("button", {
        name: /Add to Home Screen|Install|Bookmark this site/i,
      }).first();
      if (await installCta.isVisible().catch(() => false)) {
        await focus(page, installCta, 2, "Tap to install / add to Home Screen", 1600, {
          scroll: false,
        });
      }
      const confirmed = page.getByRole("button", {
        name: /I've installed it|I've bookmarked it/i,
      }).first();
      if (await confirmed.isVisible().catch(() => false)) {
        await showCompactCaption(page, 2, "Confirm once it’s on your phone");
        await highlightLocator(page, confirmed);
        await page.waitForTimeout(900);
        await hideDemoChrome(page);
        await confirmed.click({ force: true });
        await page.waitForTimeout(700);
      }
      await closeBlockingDialogs(page);
    }

    const notifyCard = page.getByText(/notification|turn on alerts|enable notifications/i).first();
    if (await notifyCard.isVisible().catch(() => false)) {
      await narrate(page, {
        step: 2,
        title: "Turn on notifications",
        body: "After install, enable alerts so you don’t miss training and match reminders.",
      }, 1800);
      await focus(page, notifyCard, 2, "Enable notifications next", 1800);
    }

    // —— 3. Dashboard ——
    await narrate(page, {
      step: 3,
      title: "Your dashboard",
      body: "Home base for training, matches, events, videos, and shortcuts.",
    }, 1700);

    await focus(
      page,
      page.getByRole("heading", { name: /^Training$/i }).first(),
      3,
      "Yellow = reply needed · Green = attending",
      2000,
    );
    await focus(
      page,
      page.getByRole("heading", { name: /^Matches$/i }).first(),
      3,
      "Upcoming matches for your squad",
      1700,
    );
    await focus(
      page,
      page.getByRole("heading", { name: /^Links$/i }).first(),
      3,
      "Shortcuts: Fixtures, Merch, Gallery…",
      1500,
    );

    // —— 4. Training RSVP ——
    await narrate(page, {
      step: 4,
      title: "Reply to training",
      body: "Open Training → pick a session → Attend or Can’t attend.",
    }, 1700);
    const trainingViewAll = page
      .locator('a[href*="/training"]')
      .filter({ hasText: /view all|all training/i })
      .first();
    if (await trainingViewAll.isVisible().catch(() => false)) {
      await tap(page, trainingViewAll);
    } else {
      await gotoSafe(page, "/training?from=dashboard");
    }
    await page
      .locator("text=/Loading\\.\\.\\./i")
      .first()
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => undefined);
    await page
      .getByRole("heading", { name: /training|september|october|november/i })
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    await scrollToTop(page);
    await showCompactCaption(page, 4, "Your training month");
    await wait(page, 1400);

    const sessionLink = page
      .locator('a[href*="/training/session/"]')
      .filter({ hasText: /response needed|respond now|unanswered/i })
      .first()
      .or(page.locator('a[href*="/training/session/"]').first());
    if (await sessionLink.first().isVisible().catch(() => false)) {
      await tap(page, sessionLink.first());
      await scrollToTop(page);
      await page.waitForTimeout(500);
      const attendBtn = page.getByRole("button", { name: /^Attend$/i });
      const cantBtn = page.getByRole("button", { name: /can.?t attend|not attending/i });
      await scrollToFocus(page, attendBtn.or(cantBtn).first()).catch(() => undefined);
      if (await attendBtn.isVisible().catch(() => false)) {
        await focus(page, attendBtn, 4, "Tap Attend if you’re coming", 2400, {
          scroll: true,
        });
      } else if (await cantBtn.isVisible().catch(() => false)) {
        await focus(page, cantBtn, 4, "Or Can’t attend", 2400);
      } else {
        await showCompactCaption(page, 4, "Confirm your availability here");
        await wait(page, 1800);
      }
    }

    // —— 5. Matches ——
    await gotoSafe(page, "/matches?from=dashboard");
    await narrate(page, {
      step: 5,
      title: "Reply to matches",
      body: "Same idea for fixtures — confirm so coaches can set the lineup.",
    }, 1700);
    await showCompactCaption(page, 5, "Times shown are warm-up times");
    await wait(page, 1400);

    const pendingMatch = page
      .locator('a[href^="/matches/"]')
      .filter({ hasText: /response needed|respond|pending|unanswered|not responded/i })
      .first();
    const matchLink = (await pendingMatch.isVisible().catch(() => false))
      ? pendingMatch
      : page.locator('a[href^="/matches/"]').nth(1).or(page.locator('a[href^="/matches/"]').first());
    if (await matchLink.first().isVisible().catch(() => false)) {
      await tap(page, matchLink.first());
      await scrollToTop(page);
      await page.waitForTimeout(500);
      const matchAttend = page.getByRole("button", { name: /^Attend$/i });
      await scrollToFocus(page, matchAttend).catch(() => undefined);
      if (await matchAttend.isVisible().catch(() => false)) {
        await focus(page, matchAttend, 5, "Confirm match attendance", 2400);
      } else {
        await showCompactCaption(page, 5, "Confirm you’re available");
        await wait(page, 1600);
      }
    }

    // —— 6. Season fixtures ——
    await gotoSafe(page, "/fixtures?team=all&from=dashboard");
    await narrate(page, {
      step: 6,
      title: "Season fixtures",
      body: "Full-year schedule for every squad — filter by team or All teams.",
    }, 1700);
    await focus(
      page,
      page.getByRole("navigation", { name: /filter fixtures by team/i }),
      6,
      "Filter by squad or All teams",
      2000,
    );

    // —— 7. Membership ——
    await gotoSafe(page, "/membership?from=dashboard");
    await narrate(page, {
      step: 7,
      title: "Membership & payments",
      body: "See your plan, what’s paid, and what’s due next.",
    }, 1600);
    await focus(
      page,
      page.getByRole("heading", { name: /membership|payment|plan/i }).first(),
      7,
      "Your membership status",
      2000,
    );

    // —— 8. Merch ——
    await gotoSafe(page, "/merchandise-order?from=dashboard");
    await narrate(page, {
      step: 8,
      title: "Club merch",
      body: "Order kit and merchandise when club orders are open.",
    }, 1500);
    await focus(
      page,
      page.getByRole("heading", { name: /merch|merchandise|order|kit/i }).first(),
      8,
      "Merchandise orders",
      1800,
    );

    // —— 9. Gallery & events ——
    await gotoSafe(page, "/gallery?from=dashboard");
    await narrate(page, {
      step: 9,
      title: "Gallery & club events",
      body: "Photo albums plus socials, clinics, and tournaments.",
    }, 1600);
    await focus(
      page,
      page.getByRole("heading", { name: /gallery|club/i }).first(),
      9,
      "Browse photo albums",
      1500,
    );
    await gotoSafe(page, "/events?from=dashboard");
    await focus(
      page,
      page.getByRole("heading", { name: /events|fun|what.?s on/i }).first(),
      9,
      "What’s on at the club",
      1600,
    );

    // —— 10. Profile ——
    await gotoSafe(page, "/profile");
    await narrate(page, {
      step: 10,
      title: "Your profile",
      body: "Change your password after first login. Update email, matchday info, and newsletter.",
    }, 1800);
    await focus(
      page,
      page.getByRole("heading", { name: /your profile/i }),
      10,
      "Profile overview",
      1400,
    );
    await focus(
      page,
      page.getByText(/^Password$/i).first(),
      10,
      "Update your password here",
      1800,
    );

    // —— 11. Menu ——
    await gotoSafe(page, "/dashboard");
    await closeBlockingDialogs(page);
    await narrate(page, {
      step: 11,
      title: "Find everything in the menu",
      body: "Dashboard, Trainings, Matches, Fixtures, Membership, Merch, Gallery, and more.",
    }, 1600);
    const menuBtn = page.getByRole("button", { name: /open menu/i }).first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await focus(page, menuBtn, 11, "Open the menu anytime", 1200, { scroll: false });
      await menuBtn.click({ force: true });
      await wait(page, 1400);
    }

    // —— 12. Closing ——
    await titleCard(
      page,
      {
        eyebrow: "You're ready",
        title: "That's everything",
        body: "Each week: check the dashboard, reply to training & matches, and message admin if you need help.",
      },
      3000,
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
  const publicMp4 = path.join(PUBLIC_DIR, "member-app-tutorial.mp4");

  if (fs.existsSync(targetWebm)) fs.unlinkSync(targetWebm);
  if (fs.existsSync(targetMp4)) fs.unlinkSync(targetMp4);
  if (fs.existsSync(finalMp4)) fs.unlinkSync(finalMp4);
  fs.renameSync(sourceWebm, targetWebm);

  if (!fs.existsSync(musicPath)) {
    throw new Error(
      `Missing ambient music at ${musicPath}. Generate tutorial-ambient.m4a first.`,
    );
  }

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

  execSync(
    [
      "ffmpeg -y",
      `-i "${targetMp4}"`,
      `-i "${musicPath}"`,
      '-filter_complex "[1:a]volume=0.22,afade=t=in:st=0:d=1.5[a]"',
      "-map 0:v -map \"[a]\" -c:v copy -c:a aac -shortest -movflags +faststart",
      `"${finalMp4}"`,
    ].join(" "),
    { stdio: "inherit" },
  );

  // Soft fade-out on music at the end of the video length.
  const duration = Number(
    execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${finalMp4}"`,
      { encoding: "utf8" },
    ).trim(),
  );
  const fadeStart = Math.max(0, duration - 2.2);
  const fadedMp4 = path.join(OUTPUT_DIR, "member-app-tutorial-faded.mp4");
  execSync(
    [
      "ffmpeg -y",
      `-i "${finalMp4}"`,
      `-af "afade=t=out:st=${fadeStart}:d=2.2"`,
      "-c:v copy -c:a aac -movflags +faststart",
      `"${fadedMp4}"`,
    ].join(" "),
    { stdio: "inherit" },
  );

  fs.renameSync(fadedMp4, targetMp4);
  if (fs.existsSync(finalMp4)) fs.unlinkSync(finalMp4);
  fs.copyFileSync(targetMp4, publicMp4);
  console.log(`Saved: ${targetMp4}`);
  console.log(`Public: ${publicMp4}`);
  console.log(`Also: ${targetWebm}`);
  console.log(`Duration: ${duration.toFixed(1)}s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
