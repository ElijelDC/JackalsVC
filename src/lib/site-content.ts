import { prisma } from "@/lib/prisma";

export type SiteContentMap = Record<string, string>;

export async function getSiteContentMap(): Promise<SiteContentMap> {
  const rows = await prisma.siteContent.findMany({
    select: { key: true, value: true },
  });

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function resolveSiteContent(
  map: SiteContentMap,
  key: string,
  fallback: string,
): string {
  const value = map[key]?.trim();
  return value || fallback;
}
