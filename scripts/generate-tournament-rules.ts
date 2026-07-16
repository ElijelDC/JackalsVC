/**
 * Generates the Jackals-branded beach tournament rules PDF (Playwright).
 * Run: npm run generate:tournament-rules-pdf
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { buildTournamentRulesHtml } from "../src/lib/tournament-rules-html";

async function logoDataUri() {
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public/brand/logo-transparent.png"),
    );
    const compact = await sharp(bytes)
      .resize(160, 160, { fit: "inside" })
      .png({ compressionLevel: 9, palette: true, colors: 64 })
      .toBuffer();
    return `data:image/png;base64,${compact.toString("base64")}`;
  } catch {
    return "";
  }
}

async function main() {
  const html = buildTournamentRulesHtml(await logoDataUri());
  const tmpDir = path.join(process.cwd(), ".tmp");
  await mkdir(tmpDir, { recursive: true });
  const htmlPath = path.join(tmpDir, "tournament-rules.html");
  await writeFile(htmlPath, html, "utf8");

  const outDir = path.join(process.cwd(), "public/downloads");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(
    outDir,
    "jvc-mixed-beach-2v2-tournament-rules.pdf",
  );

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      tagged: false,
      outline: false,
    });
  } finally {
    await browser.close();
  }

  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
