import { auth } from "@/auth";
import Link from "next/link";
import { Zap } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { visibleFeatureItems } from "@/lib/navigation";
import { getEventTypeLabel, MEMBER_ONLY_EVENT_TYPES } from "@/lib/event-filters";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageShell";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { Logo } from "@/components/layout/Logo";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const featureItems = visibleFeatureItems(isLoggedIn);

  const [upcomingEvents, featuredProducts, featuredImages] = await Promise.all([
    prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        ...(isLoggedIn
          ? {}
          : { type: { notIn: [...MEMBER_ONLY_EVENT_TYPES] } }),
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.product.findMany({ where: { active: true }, take: 3 }),
    prisma.galleryImage.findMany({ where: { featured: true }, take: 4 }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-background hero-bg">
        <PageContainer className="py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 border border-jackals-red/40 bg-jackals-red/10 px-4 py-1.5 text-sm text-jackals-red-light clip-slash-reverse">
                <Zap className="h-4 w-4" />
                Volleyball Club
              </div>
              <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-6xl">
                Welcome to <span className="text-jackals-red">Jackals VC</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Train hard, play fierce. Your home for volleyball — sessions,
                events, membership, and official club gear all in one place.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/fun-sessions">
                  <Button variant="outline">Fun sessions</Button>
                </Link>
                <Link href="/register">
                  <Button>Join the club</Button>
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -tranzinc-x-1/2 -tranzinc-y-1/2 rounded-full bg-jackals-red/15 blur-3xl lg:left-auto lg:right-12 lg:tranzinc-x-0"
              />
              <Logo
                size="hero"
                href={null}
                className="relative drop-shadow-[0_8px_32px_rgba(232,34,42,0.25)]"
              />
            </div>
          </div>
        </PageContainer>
      </section>

      <div className="section-divider mx-auto max-w-7xl" />

      <PageContainer>
        <h2 className="font-display mb-8 text-2xl font-bold text-white">
          Everything you need
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map(({ href, icon: Icon, label, description }) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-colors hover:border-jackals-red/40 hover:bg-jackals-surface">
                <div className="mb-4 flex h-10 w-10 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{label}</CardTitle>
                <CardDescription className="mt-2">{description}</CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </PageContainer>

      {upcomingEvents.length > 0 && (
        <section className="border-t border-white/10 bg-jackals-surface-muted/50 py-16">
          <PageContainer className="py-0">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-white">
                Upcoming events
              </h2>
              <Link href="/calendar" className="text-sm text-jackals-red-light hover:text-jackals-red">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <Badge className="mb-2">{getEventTypeLabel(event.type)}</Badge>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {format(event.startDate, "EEEE, d MMMM yyyy")}
                    {event.location && ` · ${event.location}`}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <PageContainer>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-white">Club shop</h2>
            <Link href="/shop" className="text-sm text-jackals-red-light hover:text-jackals-red">
              Browse all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <Card className="overflow-hidden p-0 transition-colors hover:border-jackals-red/40">
                  <ProductPlaceholder className="h-40" />
                  <div className="p-4">
                    <CardTitle>{product.name}</CardTitle>
                    <p className="mt-1 font-semibold text-jackals-red-light">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </PageContainer>
      )}

      {featuredImages.length > 0 && (
        <section className="border-t border-white/10 bg-jackals-surface-muted/50 py-16">
          <PageContainer className="py-0">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-white">
                Gallery highlights
              </h2>
              <Link href="/gallery" className="text-sm text-jackals-red-light hover:text-jackals-red">
                View gallery →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featuredImages.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square overflow-hidden border border-white/10 bg-jackals-surface"
                >
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-500">
                    {image.title}
                  </div>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>
      )}
    </>
  );
}
