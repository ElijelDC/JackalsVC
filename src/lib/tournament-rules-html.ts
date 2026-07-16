import { TOURNAMENT_RULES as R } from "./tournament-rules";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bullets(items: readonly string[]) {
  return `<ul class="bullets">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function numbered(items: readonly string[]) {
  return `<ol class="numbered">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ol>`;
}

function pageHeader(title: string) {
  return `<header class="page-header">
    <span class="page-header__title">${esc(title)}</span>
    <span class="page-header__brand">Jackals VC · Beach 2v2</span>
  </header>`;
}

function footer(page: number, total: number) {
  return `<footer class="page-footer"><span>${esc(R.website)}</span><span>${page} / ${total}</span></footer>`;
}

export function buildTournamentRulesHtml(logoDataUri: string) {
  const navCards = R.nav
    .map(
      (item) => `<article class="nav-card">
      <span class="nav-card__num">${esc(item.num)}</span>
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.blurb)}</p>
      </div>
    </article>`,
    )
    .join("");

  const scheduleRows = R.schedule
    .map(
      (row) => `<tr>
      <td class="sched-time">${esc(row.time)}</td>
      <td>${esc(row.activity)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(R.club)} ${esc(R.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #202121;
      color: #f5f5f5;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      background: #202121;
    }
    .page:last-child { page-break-after: auto; }
    .page__inner {
      height: 100%;
      padding: 11mm 13mm 12mm;
      display: flex;
      flex-direction: column;
    }
    .page__body { flex: 1; min-height: 0; }
    .page-footer {
      margin-top: auto;
      padding-top: 3.5mm;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #737373;
    }
    .display {
      font-family: Oswald, system-ui, sans-serif;
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
      margin-bottom: 1.5mm;
    }
    .section-title {
      font-size: 13.5pt;
      font-weight: 700;
      color: #fff;
      margin-bottom: 3.5mm;
      line-height: 1.15;
    }
    .block-title {
      font-family: Oswald, sans-serif;
      font-size: 9.5pt;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      margin: 3.5mm 0 2mm;
    }
    .prose { color: #a3a3a3; font-size: 9.5pt; line-height: 1.45; }
    .prose + .prose { margin-top: 2.5mm; }
    .divider {
      height: 1px;
      margin: 4mm 0;
      background: #e8222a;
      opacity: 0.55;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 3mm;
      margin-bottom: 5mm;
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
    .bullets, .numbered { list-style: none; display: grid; gap: 1.6mm; }
    .bullets li, .numbered li {
      position: relative;
      padding-left: 5mm;
      color: #a3a3a3;
      font-size: 9.3pt;
      line-height: 1.4;
    }
    .bullets li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 2mm;
      height: 2mm;
      background: #e8222a;
      border-radius: 1px;
    }
    .numbered { counter-reset: item; }
    .numbered li { counter-increment: item; padding-left: 6.5mm; }
    .numbered li::before {
      content: counter(item);
      position: absolute;
      left: 0;
      top: 0;
      width: 4.5mm;
      height: 4.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Oswald, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #ff4d54;
      background: rgba(232, 34, 42, 0.16);
    }
    .panel {
      background: #2a2b2b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
      padding: 3.5mm 4mm;
    }
    .panel::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: #e8222a;
    }
    .panel__label {
      font-family: Oswald, sans-serif;
      font-size: 7.5pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ff4d54;
      margin-bottom: 1.5mm;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
    .format-panels { display: grid; gap: 3.5mm; }
    .stack-sm > * + * { margin-top: 3.5mm; }
    .stack-md > * + * { margin-top: 5mm; }
    .callout {
      margin-top: 3mm;
      padding: 3mm 4mm;
      background: rgba(232, 34, 42, 0.1);
      border: 1px solid rgba(232, 34, 42, 0.28);
      font-size: 9pt;
      color: #d4d4d4;
      line-height: 1.4;
    }
    .nav-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2mm;
    }
    .nav-card {
      display: flex;
      gap: 2.5mm;
      align-items: flex-start;
      padding: 2.5mm 3mm;
      background: #2a2b2b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
    }
    .nav-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: #e8222a;
    }
    .nav-card__num {
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
    .nav-card h3 {
      font-family: Oswald, sans-serif;
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #fff;
      margin-bottom: 0.8mm;
    }
    .nav-card p { font-size: 8pt; color: #a3a3a3; line-height: 1.3; }
    .meta-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5mm;
      margin-bottom: 5mm;
    }
    .meta-item {
      padding: 3mm 3.5mm;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .meta-item strong {
      display: block;
      font-family: Oswald, sans-serif;
      font-size: 7.5pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #ff4d54;
      margin-bottom: 1mm;
    }
    .meta-item span { font-size: 9pt; color: #d4d4d4; }
    table.schedule {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.3pt;
    }
    table.schedule th {
      text-align: left;
      font-family: Oswald, sans-serif;
      font-size: 7.5pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #737373;
      padding: 2mm 3mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    table.schedule td {
      padding: 2.4mm 3mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: #d4d4d4;
    }
    table.schedule tr:nth-child(even) td { background: rgba(255, 255, 255, 0.02); }
    .sched-time {
      font-family: Oswald, sans-serif;
      font-weight: 600;
      color: #ff4d54;
      white-space: nowrap;
      width: 28mm;
    }
    .closing {
      margin-top: 4mm;
      text-align: center;
      font-family: Oswald, sans-serif;
      font-size: 12pt;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #ff4d54;
    }

    /* Cover */
    .cover {
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #202121;
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
    .cover__line {
      width: 42mm;
      height: 2px;
      margin: 5mm auto;
      background: #e8222a;
    }
    .cover__subtitle {
      font-family: Oswald, sans-serif;
      font-size: 12pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ff4d54;
      max-width: 140mm;
      line-height: 1.3;
    }
    .cover__meta { margin-top: 4mm; font-size: 9.5pt; color: #a3a3a3; line-height: 1.5; }
    .cover__footer {
      background: #252626;
      border-top: 1.5px solid #e8222a;
      padding: 5mm 14mm;
      text-align: center;
    }
    .cover__slogan {
      font-family: Oswald, sans-serif;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ff4d54;
    }

    /* Screen preview: flow naturally instead of rigid A4 frames */
    @media screen {
      html, body { background: #151515; }
      .page {
        width: 100%;
        max-width: 210mm;
        height: auto;
        min-height: 0;
        margin: 0 auto 12px;
        page-break-after: auto;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
      }
      .page__inner { padding: 20px 18px 24px; }
      .cover__main { padding: 48px 24px; }
      .cover__logo { width: 96px; height: 96px; }
      .cover__club { font-size: 40px; }
    }
  </style>
</head>
<body>
  <section class="page cover">
    <div class="cover__top"></div>
    <div class="cover__main">
      <img class="cover__logo" src="${logoDataUri}" alt="Jackals VC" />
      <h1 class="cover__club">Jackals VC</h1>
      <div class="cover__line"></div>
      <p class="cover__subtitle">${esc(R.title)}</p>
      <p class="cover__meta">
        ${esc(R.dateLabel)}<br />
        ${esc(R.venue)}<br />
        Tournament Intro ${esc(R.introWindow)} · Match Start ${esc(R.matchStart)}
      </p>
    </div>
    <footer class="cover__footer">
      <p class="cover__slogan">${esc(R.slogan)}</p>
    </footer>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Tournament rules")}
      <div class="page__body stack-md">
        <div>
          <p class="eyebrow">At a glance</p>
          <h2 class="section-title display">Quick navigation</h2>
          <div class="meta-bar">
            <div class="meta-item">
              <strong>Date</strong>
              <span>${esc(R.dateLabel)}</span>
            </div>
            <div class="meta-item">
              <strong>Venue</strong>
              <span>${esc(R.venue)}</span>
            </div>
            <div class="meta-item">
              <strong>Intro</strong>
              <span>${esc(R.introWindow)}</span>
            </div>
            <div class="meta-item">
              <strong>Match start</strong>
              <span>${esc(R.matchStart)}</span>
            </div>
          </div>
          <div class="nav-grid">${navCards}</div>
        </div>
        <div class="divider"></div>
        <div>
          <p class="eyebrow">Section 1</p>
          <h2 class="section-title display">Tournament overview</h2>
          ${bullets(R.overview)}
        </div>
        <div>
          <p class="eyebrow">Section 2</p>
          <h2 class="section-title display">Court rules</h2>
          <p class="prose">${esc(R.courtRulesIntro)}</p>
          <p class="block-title">Side changes</p>
          ${bullets(R.sideChanges)}
          <p class="block-title">Match turnaround</p>
          ${bullets(R.matchTurnaround)}
        </div>
      </div>
      ${footer(2, 4)}
    </div>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Subs · Match format")}
      <div class="page__body stack-md">
        <div>
          <p class="eyebrow">Section 3</p>
          <h2 class="section-title display">Substitutions</h2>
          ${bullets(R.substitutions)}
        </div>
        <div class="divider"></div>
        <div>
          <p class="eyebrow">Section 4</p>
          <h2 class="section-title display">Match format</h2>
          <div class="format-panels">
            <article class="panel">
              <p class="panel__label">Group stages</p>
              ${bullets(R.groupStages)}
            </article>
            <article class="panel">
              <p class="panel__label">Knockout stages · Semi-finals</p>
              ${bullets(R.semiFinals)}
            </article>
            <div class="two-col">
              <article class="panel">
                <p class="panel__label">3rd place playoff</p>
                ${bullets(R.thirdPlace)}
              </article>
              <article class="panel">
                <p class="panel__label">Championship final</p>
                ${bullets(R.championshipFinal)}
              </article>
            </div>
          </div>
          <div class="callout">${esc(R.finalTimeLimitNote)}</div>
          <div class="callout">${esc(R.finalFallbackNote)}</div>
        </div>
      </div>
      ${footer(3, 4)}
    </div>
  </section>

  <section class="page">
    <div class="page__inner">
      ${pageHeader("Advancement · Duties · Spirit")}
      <div class="page__body stack-md">
        <div>
          <p class="eyebrow">Section 5</p>
          <h2 class="section-title display">Group stage advancement</h2>
          <p class="prose" style="margin-bottom:2.5mm">${esc(R.advancementIntro)}</p>
          ${numbered(R.advancement)}
        </div>
        <div>
          <p class="eyebrow">Section 6</p>
          <h2 class="section-title display">Refereeing and scorekeeping</h2>
          <p class="prose">${esc(R.refereeingIntro)}</p>
          <p class="block-title">Assign one person to</p>
          ${bullets(R.refereeAssign)}
          <div class="callout">${esc(R.refereeReady)}</div>
        </div>
        <div>
          <p class="eyebrow">Section 7</p>
          <h2 class="section-title display">${esc(R.scheduleNote)}</h2>
          <table class="schedule">
            <thead>
              <tr><th>Time</th><th>Activity</th></tr>
            </thead>
            <tbody>${scheduleRows}</tbody>
          </table>
        </div>
        <div>
          <p class="eyebrow">Section 8</p>
          <h2 class="section-title display">Tournament spirit</h2>
          ${bullets(R.spirit)}
          <p class="closing">${esc(R.closing)}</p>
        </div>
      </div>
      ${footer(4, 4)}
    </div>
  </section>
</body>
</html>`;
}
