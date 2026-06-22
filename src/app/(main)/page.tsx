import { auth } from "@/auth";
import { HomePage } from "@/components/home/HomePage";
import { SHOP_ENABLED } from "@/lib/features";
import { getHomepageUpcomingEvents } from "@/lib/home-events";
import { getInstagramPosts } from "@/lib/instagram";
import { visibleFeatureItems } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Home",
};

export default async function HomePageRoute() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const [upcomingEvents, featuredProducts, featuredAlbums, instagramPosts] =
    await Promise.all([
      getHomepageUpcomingEvents(isLoggedIn, session?.user?.id, 3),
      SHOP_ENABLED
        ? prisma.product.findMany({ where: { active: true }, take: 3 })
        : Promise.resolve([]),
      prisma.galleryAlbum.findMany({
        where: { featured: true },
        take: 4,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      getInstagramPosts(6),
    ]);

  return (
    <HomePage
      featureItems={visibleFeatureItems(isLoggedIn)}
      upcomingEvents={upcomingEvents}
      featuredProducts={featuredProducts}
      featuredAlbums={featuredAlbums}
      instagramPosts={instagramPosts}
    />
  );
}
