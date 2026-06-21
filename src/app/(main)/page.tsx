import { auth } from "@/auth";
import { HomePage } from "@/components/home/HomePage";
import { getHomepageUpcomingEvents } from "@/lib/home-events";
import { visibleFeatureItems } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Home",
};

export default async function HomePageRoute() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const [upcomingEvents, featuredProducts, featuredImages] = await Promise.all([
    getHomepageUpcomingEvents(isLoggedIn, 3),
    prisma.product.findMany({ where: { active: true }, take: 3 }),
    prisma.galleryImage.findMany({ where: { featured: true }, take: 4 }),
  ]);

  return (
    <HomePage
      featureItems={visibleFeatureItems(isLoggedIn)}
      upcomingEvents={upcomingEvents}
      featuredProducts={featuredProducts}
      featuredImages={featuredImages}
    />
  );
}
