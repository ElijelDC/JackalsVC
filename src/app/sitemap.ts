import type { MetadataRoute } from "next";
import { SHOP_ENABLED } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.9 },
  { path: "/teams", changeFrequency: "weekly", priority: 0.9 },
  { path: "/events", changeFrequency: "daily", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gallery", changeFrequency: "weekly", priority: 0.8 },
  { path: "/achievements", changeFrequency: "monthly", priority: 0.7 },
  { path: "/register", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sponsors", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sponsors/partners", changeFrequency: "monthly", priority: 0.6 },
  { path: "/coaching", changeFrequency: "monthly", priority: 0.7 },
  {
    path: "/tournaments/jvc-mixed-2v2-beach",
    changeFrequency: "weekly",
    priority: 0.7,
  },
];

function staticEntries(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticEntries();

  if (SHOP_ENABLED) {
    entries.push({
      url: absoluteUrl("/shop"),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  try {
    const [teams, albums, products] = await Promise.all([
      prisma.clubTeam.findMany({
        select: { id: true, createdAt: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.galleryAlbum.findMany({
        select: { id: true, createdAt: true },
        orderBy: { sortOrder: "asc" },
      }),
      SHOP_ENABLED
        ? prisma.product.findMany({
            where: { active: true },
            select: { id: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    for (const team of teams) {
      entries.push({
        url: absoluteUrl(`/teams/${team.id}`),
        lastModified: team.createdAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const album of albums) {
      entries.push({
        url: absoluteUrl(`/gallery/${album.id}`),
        lastModified: album.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const product of products) {
      entries.push({
        url: absoluteUrl(`/shop/${product.id}`),
        lastModified: product.createdAt,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch (error) {
    console.error("sitemap: failed to load dynamic routes:", error);
  }

  return entries;
}
