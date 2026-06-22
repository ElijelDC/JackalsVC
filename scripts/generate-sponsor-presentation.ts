/**
 * Generates the club sponsor presentation PDF from branded HTML (Playwright).
 * Run: npm run generate:sponsor-pdf
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { buildSponsorPresentationHtml } from "../src/lib/sponsor-presentation-html";

async function logoDataUri() {
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public/brand/logo-transparent.png"),
    );
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

async function main() {
  const html = buildSponsorPresentationHtml(await logoDataUri());
  const tmpDir = path.join(process.cwd(), ".tmp");
  await mkdir(tmpDir, { recursive: true });
  const htmlPath = path.join(tmpDir, "sponsor-presentation.html");
  await writeFile(htmlPath, html, "utf8");

  const outDir = path.join(process.cwd(), "public/downloads");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "jackals-vc-sponsor-presentation.pdf");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
