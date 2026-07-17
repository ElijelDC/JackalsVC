import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SponsorPackageExampleImages } from "@/lib/sponsor-presentation-html";

async function pngDataUri(relativePath: string) {
  try {
    const bytes = await readFile(path.join(process.cwd(), relativePath));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function loadSponsorPresentationLogo() {
  return pngDataUri("public/brand/logo-transparent.png");
}

export async function loadSponsorPackageExampleImages(): Promise<SponsorPackageExampleImages> {
  const [club, spotlight, matchday] = await Promise.all([
    pngDataUri("public/downloads/sponsor-examples/sponsor-package-club-partner.png"),
    pngDataUri(
      "public/downloads/sponsor-examples/sponsor-package-spotlight-partner.png",
    ),
    pngDataUri(
      "public/downloads/sponsor-examples/sponsor-package-matchday-kit-partner.png",
    ),
  ]);

  return {
    ...(club ? { club } : {}),
    ...(spotlight ? { spotlight } : {}),
    ...(matchday ? { matchday } : {}),
  };
}
