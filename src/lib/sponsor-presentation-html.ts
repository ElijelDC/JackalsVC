import {
  PRESENTATION_ABOUT,
  PRESENTATION_CLOSING,
  PRESENTATION_INVESTMENT_AREAS,
  PRESENTATION_MISSION,
  PRESENTATION_PACKAGES,
  PRESENTATION_PARTNER_BENEFITS,
  PRESENTATION_SEASON,
  PRESENTATION_STATS,
  PRESENTATION_SUPPORT_POINTS,
  PRESENTATION_VISION,
} from "./sponsor-presentation";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bullets(items: string[]) {
  return `<ul class="bullets">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function pageHeader(title: string) {
  return `<header class="page-header">
    <span class="page-header__title">${esc(title)}</span>
    <span class="page-header__brand">Jackals VC · ${esc(PRESENTATION_SEASON)}</span>
  </header>`;
}

function footer(page: number, total: number) {
  return `<footer class="page-footer"><span>jackalsvolleyball.com</span><span>${page} / ${total}</span></footer>`;
}

function statGrid() {
  return `<div class="stat-grid">${PRESENTATION_STATS.map(
    (stat) => `<article class="stat-card">
      <p class="stat-card__value">${esc(stat.value)}</p>
      <p class="stat-card__label">${esc(stat.label)}</p>
    </article>`,
  ).join("")}</div>`;
}

function packageCards() {
  return `<div class="pkg-grid">${PRESENTATION_PACKAGES.map((pack, index) => {
    const featured = index === PRESENTATION_PACKAGES.length - 1;
    return `<article class="pkg-card${featured ? " pkg-card--featured" : ""}">
      <p class="pkg-card__eyebrow">Investment</p>
      <p class="pkg-card__price">${esc(pack.priceLabel)}</p>
      <h3 class="pkg-card__name">${esc(pack.name)}</h3>
      <p class="pkg-card__summary">${esc(pack.summary)}</p>
      <ul class="pkg-card__list">
        ${pack.highlights.map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </article>`;
  }).join("")}</div>`;
}

export type SponsorPackageExampleImages = {
  club?: string;
  spotlight?: string;
  matchday?: string;
};

function packageExamplePage(opts: {
  title: string;
  priceLabel: string;
  blurb: string;
  imageDataUri: string;
  page: number;
  total: number;
}) {
  return `<section class="page">
    <div class="page__inner">
      ${pageHeader("Package example")}
      <div class="page__body example-slide">
        <div>
          <p class="eyebrow">${esc(opts.title)} · ${esc(opts.priceLabel)}</p>
          <h2 class="section-title display">What it looks like</h2>
          <p class="prose prose--sm">${esc(opts.blurb)}</p>
          <p class="example-note">ACME is a placeholder brand for illustration only.</p>
        </div>
        <div class="example-frame">
          <img src="${opts.imageDataUri}" alt="${esc(opts.title)} example" />
        </div>
      </div>
      ${footer(opts.page, opts.total)}
    </div>
  </section>`;
}

export function buildSponsorPresentationHtml(
  logoDataUri: string,
  packageExamples: SponsorPackageExampleImages = {},
) {
  const exampleSlides = [
    packageExamples.club
      ? {
          title: "Club Partner",
          priceLabel: "€150",
          blurb:
            "Website listing on Our Sponsors, plus Instagram and Facebook recognition with a thank-you post.",
          imageDataUri: packageExamples.club,
        }
      : null,
    packageExamples.spotlight
      ? {
          title: "Spotlight Partner",
          priceLabel: "€350",
          blurb:
            "Dedicated spotlight post, season-long Instagram and Facebook mentions, and recognition on fun session pages — plus all Club Partner benefits.",
          imageDataUri: packageExamples.spotlight,
        }
      : null,
    packageExamples.matchday
      ? {
          title: "Matchday & Kit Partner",
          priceLabel: "€750",
          blurb:
            "Kit sleeve, training quarter-zip, courtside banner, matchday recognition, and branded content — plus all Spotlight Partner benefits.",
          imageDataUri: packageExamples.matchday,
        }
      : null,
  ].filter(Boolean) as {
    title: string;
    priceLabel: string;
    blurb: string;
    imageDataUri: string;
  }[];

  const totalPages = 6 + exampleSlides.length;
  const about = PRESENTATION_ABOUT.map((p) => `<p>${esc(p)}</p>`).join("");
  const investments = PRESENTATION_INVESTMENT_AREAS.map(
    (item, i) => `<article class="invest-card">
      <span class="invest-card__num">${i + 1}</span>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.detail)}</p>
      </div>
    </article>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Jackals VC Sponsor Presentation ${esc(PRESENTATION_SEASON)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #202121;
      color: #f5f5f5;
      font-family: Inter, system-ui, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      background-color: #202121;
      background-image:
        radial-gradient(ellipse 55% 50% at 80% 15%, rgba(232, 34, 42, 0.12) 0%, transparent 68%),
        radial-gradient(ellipse 40% 30% at 10% 85%, rgba(232, 34, 42, 0.06) 0%, transparent 55%);
    }
    .page:last-child { page-break-after: auto; }
    .page__inner {
      height: 100%;
      padding: 12mm 14mm 14mm;
      display: flex;
      flex-direction: column;
    }
    .page__body { flex: 1; min-height: 0; }
    .page-footer {
      margin-top: auto;
      padding-top: 4mm;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #737373;
    }
    .display {
      font-family: Oswald, Inter, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .eyebrow {
      font-family: Oswald, sans-serif;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #ff4d54;
      margin-bottom: 2mm;
    }
    .section-title {
      font-size: 15pt;
      font-weight: 700;
      color: #fff;
      margin-bottom: 5mm;
      line-height: 1.15;
    }
    .prose { color: #a3a3a3; }
    .prose p + p { margin-top: 3mm; }
    .prose--sm { font-size: 9.5pt; line-height: 1.45; }
    .divider {
      height: 2px;
      margin: 4mm 0;
      background: linear-gradient(90deg, transparent, #e8222a 20%, #e8222a 80%, transparent);
      opacity: 0.45;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 3.5mm;
      margin-bottom: 6mm;
      border-bottom: 1.5px solid #e8222a;
    }
    .page-header__title {
      font-family: Oswald, sans-serif;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #fff;
    }
    .page-header__brand {
      font-size: 7.5pt;
      color: #737373;
      letter-spacing: 0.04em;
    }
    .bullets { list-style: none; display: grid; gap: 2mm; }
    .bullets li {
      position: relative;
      padding-left: 5mm;
      color: #a3a3a3;
      font-size: 9.5pt;
      line-height: 1.4;
    }
    .bullets li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 2.5mm;
      height: 2.5mm;
      background: #e8222a;
      clip-path: polygon(0 0, 100% 0, 100% 100%);
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3.5mm;
    }
    @media print {
      .stat-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .stat-card, .opp-card, .invest-card, .panel {
      background: #2a2b2b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
    }
    .stat-card::before, .opp-card::before, .invest-card::before, .panel::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, #e8222a, #ff4d54);
    }
    .stat-card { padding: 4mm 4mm; }
    .stat-card__value {
      font-family: Oswald, sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #ff4d54;
      line-height: 1;
    }
    .stat-card__label { margin-top: 2mm; font-size: 8pt; color: #a3a3a3; line-height: 1.3; }
    .opp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
    .opp-card { padding: 3.5mm 4mm; min-height: 22mm; }
    .opp-card h3 {
      font-family: Oswald, sans-serif;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #fff;
      margin-bottom: 1.5mm;
    }
    .opp-card p { font-size: 8.5pt; color: #a3a3a3; line-height: 1.35; }
    .pkg-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3.5mm;
      align-items: stretch;
      flex: 1;
    }
    .pkg-card {
      display: flex;
      flex-direction: column;
      padding: 4.5mm 4mm;
      background: #2a2b2b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
      min-height: 0;
    }
    .pkg-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: #e8222a;
    }
    .pkg-card--featured {
      background: rgba(232, 34, 42, 0.1);
      border-color: rgba(232, 34, 42, 0.4);
    }
    .pkg-card__eyebrow {
      font-family: Oswald, sans-serif;
      font-size: 7pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ff4d54;
    }
    .pkg-card__price {
      margin-top: 2mm;
      font-family: Oswald, sans-serif;
      font-size: 22pt;
      font-weight: 700;
      color: #fff;
      line-height: 1;
    }
    .pkg-card__name {
      margin-top: 2.5mm;
      font-family: Oswald, sans-serif;
      font-size: 11pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #fff;
    }
    .pkg-card__summary {
      margin-top: 2mm;
      font-size: 8pt;
      color: #a3a3a3;
      line-height: 1.35;
      min-height: 12mm;
    }
    .pkg-card__list {
      list-style: none;
      margin-top: 3.5mm;
      display: grid;
      gap: 1.8mm;
      flex: 1;
    }
    .pkg-card__list li {
      position: relative;
      padding-left: 4mm;
      font-size: 7.8pt;
      color: #d4d4d4;
      line-height: 1.35;
    }
    .pkg-card__list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 1.8mm;
      height: 1.8mm;
      background: #e8222a;
    }
    .invest-list { display: grid; gap: 2.5mm; }
    .invest-card {
      display: flex;
      gap: 3.5mm;
      align-items: flex-start;
      padding: 3mm 4mm;
    }
    .invest-card__num {
      flex-shrink: 0;
      width: 7mm;
      height: 7mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(232, 34, 42, 0.18);
      color: #ff4d54;
      font-family: Oswald, sans-serif;
      font-weight: 700;
      font-size: 10pt;
    }
    .invest-card h3 {
      font-family: Oswald, sans-serif;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #fff;
      margin-bottom: 1mm;
    }
    .invest-card p { font-size: 8.5pt; color: #a3a3a3; line-height: 1.35; }
    .panel { padding: 4mm 5mm; }
    .panel__label {
      font-family: Oswald, sans-serif;
      font-size: 7.5pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ff4d54;
      margin-bottom: 1.5mm;
    }
    .panel__title { font-size: 9pt; font-weight: 600; color: #fff; margin-bottom: 1.5mm; }
    .panel__text { font-size: 9pt; color: #a3a3a3; line-height: 1.4; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .digital-bar {
      margin-top: 3mm;
      padding: 3.5mm 4mm;
      background: rgba(232, 34, 42, 0.1);
      border: 1px solid rgba(232, 34, 42, 0.28);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4mm;
    }
    .digital-bar strong {
      font-family: Oswald, sans-serif;
      font-size: 10pt;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #fff;
    }
    .digital-bar span { font-size: 9pt; color: #d4d4d4; }

    /* Cover */
    .cover {
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-image:
        radial-gradient(ellipse 70% 55% at 50% 38%, rgba(232, 34, 42, 0.18) 0%, transparent 70%),
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
      background-size: auto, 24px 24px;
    }
    .cover__top { height: 2px; background: #e8222a; }
    .cover__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 16mm;
    }
    .cover__logo { width: 34mm; height: 34mm; object-fit: contain; margin-bottom: 6mm; }
    .cover__club {
      font-family: Oswald, sans-serif;
      font-size: 34pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #fff;
      line-height: 1;
    }
    .cover__season { margin-top: 4mm; font-size: 11pt; color: #a3a3a3; }
    .cover__line {
      width: 42mm;
      height: 2px;
      margin: 5mm auto;
      background: linear-gradient(90deg, transparent, #e8222a, transparent);
    }
    .cover__subtitle {
      font-family: Oswald, sans-serif;
      font-size: 12pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ff4d54;
      max-width: 120mm;
      line-height: 1.3;
    }
    .cover__meta { margin-top: 4mm; font-size: 9.5pt; color: #737373; }
    .cover__footer {
      background: #252626;
      border-top: 1.5px solid #e8222a;
      padding: 5mm 14mm;
      text-align: center;
    }
    .cover__slogan {
      font-family: Oswald, sans-serif;
      font-size: clamp(6pt, 2.4vw, 9pt);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ff4d54;
      white-space: nowrap;
    }

    /* Thank you */
    .cta-box {
      margin-top: 4mm;
      padding: 5mm;
      background: #2a2b2b;
      border: 1px solid rgba(232, 34, 42, 0.35);
      position: relative;
    }
    .cta-box::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, #e8222a, #ff4d54);
    }
    .cta-box h3 {
      font-family: Oswald, sans-serif;
      font-size: 14pt;
      text-transform: uppercase;
      color: #fff;
      margin-bottom: 2mm;
    }
    .cta-box .email {
      display: inline-block;
      margin: 3mm 0;
      padding: 2mm 3.5mm;
      background: rgba(232, 34, 42, 0.12);
      border: 1px solid rgba(232, 34, 42, 0.4);
      font-size: 11pt;
      font-weight: 600;
      color: #ff4d54;
    }
    .cta-links { margin-top: 2mm; font-size: 9pt; color: #a3a3a3; }
    .cta-links span + span::before { content: " · "; }
    .stack-sm > * + * { margin-top: 4mm; }
    .stack-md > * + * { margin-top: 7mm; }

    /* Package example slides */
    .example-slide {
      display: flex;
      flex-direction: column;
      gap: 4mm;
      min-height: 0;
    }
    .example-note {
      margin-top: 2mm;
      font-size: 9pt;
      font-weight: 700;
      color: #eab308;
    }
    .example-frame {
      flex: 1;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #151515;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }
    .example-frame img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* Screen preview: fluid layout for phones (print/PDF keeps A4) */
    @media screen {
      html, body {
        background: #151515;
        overflow-x: hidden;
      }
      .page {
        width: 100%;
        max-width: 210mm;
        height: auto;
        min-height: 0;
        margin: 0 auto 12px;
        page-break-after: auto;
        overflow: visible;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
      }
      .page__inner {
        height: auto;
        min-height: 0;
        padding: 20px 18px 24px;
      }
      .page__body { min-height: 0; }
      .cover {
        min-height: min(100dvh, 640px);
      }
      .cover__main { padding: 48px 24px; }
      .cover__logo { width: 96px; height: 96px; margin-bottom: 20px; }
      .cover__club { font-size: clamp(28px, 10vw, 44px); }
      .cover__subtitle {
        font-size: clamp(14px, 4.2vw, 18px);
        max-width: 100%;
        padding: 0 8px;
      }
      .cover__slogan {
        white-space: normal;
        font-size: clamp(11px, 3.2vw, 14px);
        line-height: 1.35;
      }
      .section-title { font-size: clamp(18px, 5vw, 22px); }
      .two-col,
      .opp-grid,
      .stat-grid {
        grid-template-columns: 1fr;
      }
      .digital-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .page-header {
        flex-wrap: wrap;
        gap: 6px;
      }
      .cta-box .email {
        display: block;
        word-break: break-word;
      }
      .example-frame {
        min-height: 220px;
        aspect-ratio: 16 / 10;
      }
    }

    @media screen and (min-width: 640px) {
      .two-col,
      .opp-grid { grid-template-columns: 1fr 1fr; }
      .stat-grid { grid-template-columns: repeat(3, 1fr); }
      .pkg-grid { grid-template-columns: repeat(3, 1fr); }
      .digital-bar {
        flex-direction: row;
        align-items: center;
      }
    }

    @media screen and (max-width: 639px) {
      .pkg-grid { grid-template-columns: 1fr; }
      .pkg-card__summary { min-height: 0; }
    }
  </style>
</head>
<body>
  <section class="page cover">
    <div class="cover__top"></div>
    <div class="cover__main">
      <img class="cover__logo" src="${logoDataUri}" alt="Jackals VC" />
      <h1 class="cover__club">Jackals VC</h1>
      <p class="cover__season">Season ${esc(PRESENTATION_SEASON)}</p>
      <div class="cover__line"></div>
      <p class="cover__subtitle">Club Presentation &amp; Sponsorship Proposal</p>
      <p class="cover__meta">Irish National League · Dublin</p>
    </div>
    <footer class="cover__footer">
      <p class="cover__slogan">${esc(PRESENTATION_CLOSING.slogan)}</p>
    </footer>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("About the club")}
      <div class="page__body stack-md">
        <div>
          <p class="eyebrow">Who we are</p>
          <h2 class="section-title display">Jackals Volleyball Club</h2>
          <div class="prose">${about}</div>
        </div>
        <div class="two-col">
          <article class="panel">
            <p class="panel__label">Vision</p>
            <p class="panel__text">${esc(PRESENTATION_VISION)}</p>
          </article>
          <article class="panel">
            <p class="panel__label">Mission</p>
            <p class="panel__text">${esc(PRESENTATION_MISSION)}</p>
          </article>
        </div>
        <div>
          <p class="eyebrow">Reach</p>
          <h2 class="section-title display">By the numbers</h2>
          ${statGrid()}
          <div class="digital-bar">
            <strong>Digital presence</strong>
            <span>@jackalsvolleyball · facebook.com/JackalsVC · jackalsvolleyball.com</span>
          </div>
        </div>
      </div>
      ${footer(2, totalPages)}
    </div>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Why sponsor")}
      <div class="page__body stack-md">
        <div>
          <p class="eyebrow">Partnership</p>
          <h2 class="section-title display">What your brand gains</h2>
          ${bullets(PRESENTATION_PARTNER_BENEFITS)}
        </div>
        <div class="divider"></div>
        <div>
          <p class="eyebrow">Your impact</p>
          <h2 class="section-title display">Support through Jackals VC</h2>
          ${bullets(PRESENTATION_SUPPORT_POINTS)}
        </div>
      </div>
      ${footer(3, totalPages)}
    </div>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Packages")}
      <div class="page__body" style="display:flex;flex-direction:column;gap:5mm">
        <div>
          <p class="eyebrow">2026/27 season</p>
          <h2 class="section-title display">Sponsorship packages</h2>
          <p class="prose prose--sm">Three clear options — pick the fit for your brand, or ask us about a custom partnership. Example visuals for each package follow.</p>
          <p class="prose prose--sm" style="margin-top:2.5mm">Your sponsorship directly supports court hire, player development, competitive volleyball, and affordable access to the sport in our local community.</p>
        </div>
        ${packageCards()}
      </div>
      ${footer(4, totalPages)}
    </div>
  </section>

  ${exampleSlides
    .map((slide, index) =>
      packageExamplePage({
        ...slide,
        page: 5 + index,
        total: totalPages,
      }),
    )
    .join("\n")}

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Sponsorship")}
      <div class="page__body stack-md">
        <div>
          <p class="eyebrow">Investment</p>
          <h2 class="section-title display">Where sponsorship helps</h2>
          <p class="prose prose--sm">Jackals VC is a community-based club run by volunteers. Sponsorship helps us grow our squads and keep volleyball accessible in Dublin. Your support can target:</p>
        </div>
        <div class="invest-list">${investments}</div>
      </div>
      ${footer(5 + exampleSlides.length, totalPages)}
    </div>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Thank you")}
      <div class="page__body stack-sm">
        <div>
          <p class="eyebrow">Get in touch</p>
          <h2 class="section-title display">Thank you</h2>
          <div class="prose prose--sm">
            <p>${esc(PRESENTATION_CLOSING.thanks)}</p>
            <p>${esc(PRESENTATION_CLOSING.cta)}</p>
          </div>
        </div>
        <div class="cta-box">
          <p class="eyebrow" style="margin-bottom:3mm">Contact</p>
          <h3>Let's talk sponsorship</h3>
          <p class="prose prose--sm">Email us with your company name and how you would like to partner with the club.</p>
          <p class="email">${esc(PRESENTATION_CLOSING.email)}</p>
          <p class="prose prose--sm">Subject: ${esc(PRESENTATION_CLOSING.subject)}</p>
          <p class="cta-links">${PRESENTATION_CLOSING.links.map((l) => `<span>${esc(l)}</span>`).join("")}</p>
        </div>
        <p class="display" style="text-align:center;font-size:9pt;color:#ff4d54;margin-top:auto;padding-top:6mm">${esc(PRESENTATION_CLOSING.slogan)}</p>
      </div>
      ${footer(6 + exampleSlides.length, totalPages)}
    </div>
  </section>
</body>
</html>`;
}
