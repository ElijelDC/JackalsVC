import { prisma } from "@/lib/prisma";

export type SiteContentMap = Record<string, string>;

export async function getSiteContentMap(): Promise<SiteContentMap> {
  try {
    const rows = await prisma.siteContent.findMany({
      select: { key: true, value: true },
    });

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch (error) {
    console.error("Failed to load site content:", error);
    return {};
  }
}

export function resolveSiteContent(
  map: SiteContentMap,
  key: string,
  fallback: string,
): string {
  const value = map[key]?.trim();
  return value || fallback;
}
