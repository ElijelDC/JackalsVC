#!/usr/bin/env python3
"""Embed v6 template + swap YouTube demos for illustrated guide links."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "public/agent/setter-preseason-workout-plan.html"
TPL = ROOT / "public/agent/setter-template-v6.json"
GUIDES = json.loads((Path(__file__).parent / "exercise-guide-urls.json").read_text())

html = HTML.read_text()
tpl_min = json.dumps(json.loads(TPL.read_text()), separators=(",", ":"), ensure_ascii=False)
guide_min = json.dumps(GUIDES, separators=(",", ":"), ensure_ascii=False)

start = html.index('<script type="application/json" id="setter-workout-template-data">')
end = html.index("</script>", start)
html = (
    html[:start]
    + '<script type="application/json" id="setter-workout-template-data">'
    + tpl_min
    + html[end:]
)

if 'id="exercise-guide-keywords"' not in html:
    html = html.replace(
        '<input type="file" accept="application/json"',
        f'<script type="application/json" id="exercise-guide-keywords">{guide_min}</script>\n    <input type="file" accept="application/json"',
        1,
    )

html = html.replace("const APP_RELEASE_VERSION = 5;", "const APP_RELEASE_VERSION = 6;", 1)
html = html.replace("const VIDEO_CATALOG_VERSION = 3;", "const GUIDE_CATALOG_VERSION = 1;", 1)

start_vid = html.index("/** oEmbed-validated YouTube IDs")
end_vid = html.index("function loadWorkoutTemplate()")
new_block = r"""
      let EXERCISE_GUIDE_DATA = null;

      function loadExerciseGuideData() {
        if (EXERCISE_GUIDE_DATA) return EXERCISE_GUIDE_DATA;
        const el = document.getElementById("exercise-guide-keywords");
        EXERCISE_GUIDE_DATA = el?.textContent ? JSON.parse(el.textContent) : { keywords: [], categoryFallback: {} };
        return EXERCISE_GUIDE_DATA;
      }

      function lookupGuideUrl(name, category) {
        const data = loadExerciseGuideData();
        const n = (name || "").toLowerCase();
        for (const [keyword, url] of data.keywords || []) {
          if (n.includes(keyword)) return url;
        }
        const fb = data.categoryFallback || {};
        return fb[category] || fb.strength || "https://exrx.net/Lists/Directory";
      }

      function exerciseGuideUrl(ex) {
        const custom = (ex.guideUrl || "").trim();
        if (custom) return custom;
        return lookupGuideUrl(ex.name, ex.category);
      }

      function guideSourceLabel(url) {
        if (url.includes("exrx.net")) return "ExRx.net (illustrated exercise directory)";
        if (url.includes("acefitness.org")) return "ACE Fitness exercise library";
        if (url.includes("physio-pedia.com")) return "Physiopedia";
        if (url.includes("artofcoaching.com")) return "Art of Coaching volleyball drills";
        return "External illustrated guide";
      }
"""

html = html[:start_vid] + new_block + html[end_vid:]

html = html.replace(
    "videoCatalogVersion: VIDEO_CATALOG_VERSION,",
    "guideCatalogVersion: GUIDE_CATALOG_VERSION,",
)
html = html.replace(
    "videoId: lookupVideoId(ex.name, ex.category),",
    "guideUrl: ex.guideUrl || lookupGuideUrl(ex.name, ex.category),",
)

html = re.sub(
    r"const needsVideoRefresh =[\s\S]*?plan\.videoCatalogVersion = VIDEO_CATALOG_VERSION;",
    """const needsGuideRefresh =
          !plan.guideCatalogVersion || plan.guideCatalogVersion < GUIDE_CATALOG_VERSION;
        for (const week of plan.weeks) {
          for (const day of week.days) {
            for (const ex of day.exercises) {
              if (!ex.doneSets || ex.doneSets.length !== ex.sets) {
                ex.doneSets = Array.from({ length: ex.sets }, (_, i) =>
                  Boolean(ex.doneSets?.[i]),
                );
              }
              if (needsGuideRefresh || !ex.guideUrl) {
                ex.guideUrl = lookupGuideUrl(ex.name, ex.category);
              }
              delete ex.videoId;
            }
          }
        }
        plan.guideCatalogVersion = GUIDE_CATALOG_VERSION;
        delete plan.videoCatalogVersion;""",
    html,
    count=1,
)

html = html.replace("ex.videoId = lookupVideoId(ex.name, ex.category);", "ex.guideUrl = exerciseGuideUrl(ex);")
html = html.replace("videoCatalogVersion: VIDEO_CATALOG_VERSION,", "guideCatalogVersion: GUIDE_CATALOG_VERSION,")

html = re.sub(
    r"function openVideoModal\(ex\) \{[\s\S]*?document\.getElementById\(\"video-overlay\"\)\.setAttribute\(\"aria-hidden\", \"false\"\);\n      \}",
    r"""function openGuideModal(ex) {
        const url = exerciseGuideUrl(ex);
        const label = guideSourceLabel(url);
        document.getElementById("video-title").textContent = ex.name;
        document.getElementById("video-overlay-actions").innerHTML = `<a href="${escapeAttr(
          url,
        )}" target="_blank" rel="noopener noreferrer">Open illustrated guide</a>`;
        document.getElementById("video-frame-wrap").innerHTML = `<div style="padding:16px;color:var(--muted);font-size:0.88rem;line-height:1.5">
          <p style="margin:0 0 12px;color:var(--text)">Use the link above for step-by-step photos and cues from <strong>${escapeHtml(
            label,
          )}</strong>.</p>
          <p style="margin:0">Pain above 3/10 → stop and adjust load or swap the movement.</p>
        </div>`;
        document.getElementById("video-overlay").classList.add("open");
        document.getElementById("video-overlay").setAttribute("aria-hidden", "false");
      }""",
    html,
    count=1,
)

html = html.replace("function closeVideoModal()", "function closeGuideModal()")
html = html.replace("closeVideoModal()", "closeGuideModal()")
html = html.replace("openVideoModal(", "openGuideModal(")

html = html.replace(
    """          : `<button type="button" class="video-btn" data-action="video" data-ex="${ex.id}">
              <img class="video-thumb" src="https://i.ytimg.com/vi/${encodeURIComponent(
                exerciseVideoId(ex),
              )}/mqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
              <span class="video-copy"><strong>Watch demo</strong><span>Form cue video for this movement</span></span>
            </button>""",
    """          : `<a class="video-btn guide-btn" href="${escapeAttr(
              exerciseGuideUrl(ex),
            )}" target="_blank" rel="noopener noreferrer" data-action="guide" data-ex="${ex.id}">
              <span class="guide-icon" aria-hidden="true">📷</span>
              <span class="video-copy"><strong>How to do it</strong><span>Illustrated guide (photos) · ${escapeHtml(
                guideSourceLabel(exerciseGuideUrl(ex)).split(" (")[0],
              )}</span></span>
            </a>""",
)

html = html.replace(
    '<div><label>YouTube video ID</label><input data-field="videoId"',
    '<div><label>Guide URL</label><input data-field="guideUrl"',
)
html = html.replace("ex.videoId ||", "ex.guideUrl ||")
html = html.replace('data-field="videoId"', 'data-field="guideUrl"')

html = html.replace(
    'document.querySelectorAll("[data-action=\'video\']")',
    'document.querySelectorAll("[data-action=\'guide\']")',
)

html = html.replace(
    """/** Merge newest default template + demo videos; keep logged sets for matching exercises. */""",
    """/** Merge newest default template + guide URLs; keep logged sets for matching exercises. */""",
)

html = html.replace(
    '<h2 id="video-title">Exercise demo</h2>',
    '<h2 id="video-title">Exercise guide</h2>',
)

# Add exercise with guideUrl in add exercise handler
html = html.replace(
    "videoId: lookupVideoId(\"squat\", \"strength\"),",
    "guideUrl: lookupGuideUrl(\"squat\", \"strength\"),",
)

# Tools: prehab + taper card
tools_insert = """
            <div class="tools-card">
              <h3>Daily prehab (12 min)</h3>
              <p id="tools-prehab-summary">—</p>
            </div>
            <div class="tools-card">
              <h3>Taper to match</h3>
              <ul id="tools-taper-list" style="margin:0;padding-left:1.1rem;color:var(--muted);font-size:0.85rem"></ul>
            </div>
"""
if "tools-prehab-summary" not in html:
    html = html.replace(
        '<div class="tools-card">\n              <h3>Full plan (read / print)</h3>',
        tools_insert
        + '\n            <div class="tools-card">\n              <h3>Full plan (read / print)</h3>',
    )

html = html.replace(
    "state.templateVersion = plan.planTemplateVersion ?? targetTemplateVersion();",
    """state.templateVersion = plan.planTemplateVersion ?? targetTemplateVersion();
        renderToolsMeta();""",
)

if "function renderToolsMeta" not in html:
    html = html.replace(
        "function renderPreservingScroll() {",
        """function renderToolsMeta() {
        const tpl = WORKOUT_TEMPLATE;
        const prehabEl = document.getElementById("tools-prehab-summary");
        const taperEl = document.getElementById("tools-taper-list");
        if (!tpl || !prehabEl) return;
        const blocks = tpl.prehabDaily?.blocks || [];
        prehabEl.textContent = blocks.length
          ? `Every day · ${tpl.prehabDaily.durationMin || "12"} min · ${blocks
              .map((b) => b.items?.length || 0)
              .reduce((a, b) => a + b, 0)} movements`
          : "See Sunday for full prehab list.";
        if (taperEl && tpl.taperPhases) {
          taperEl.innerHTML = tpl.taperPhases
            .map((p) => `<li><strong>${escapeHtml(p.dates)}</strong> — ${escapeHtml(p.adjustments)}</li>`)
            .join("");
        }
      }

      function renderPreservingScroll() {""",
    )

HTML.write_text(html)
print("patched", HTML)
