import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import type { EventListItem } from "@/lib/event-filters";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { EventListCard } from "@/components/events/EventListCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { Logo } from "@/components/layout/Logo";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { formatPrice } from "@/lib/utils";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";
import type { InstagramPost } from "@/lib/instagram";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import type { Product } from "@/types/product";

function FeatureCard({
  href,
  icon: Icon,
  label,
  description,
}: NavItem) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="motion-hover-lift relative h-full overflow-hidden border-white/10 bg-jackals-surface/80 group-hover:border-jackals-red/35 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />
        <div className="mb-4 flex h-11 w-11 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse transition-colors group-hover:bg-jackals-red/25">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="flex items-center justify-between gap-2">
          {label}
          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-jackals-red-light" />
        </CardTitle>
        <CardDescription className="mt-2 leading-relaxed">
          {description}
        </CardDescription>
      </Card>
    </Link>
  );
}

type FeaturedAlbum = {
  id: string;
  title: string;
  coverImageUrl: string;
};

export function HomePage({
  featureItems,
  upcomingEvents,
  featuredProducts,
  featuredAlbums,
  instagramPosts,
}: {
  featureItems: NavItem[];
  upcomingEvents: EventListItem[];
  featuredProducts: Product[];
  featuredAlbums: FeaturedAlbum[];
  instagramPosts: InstagramPost[];
}) {
  return (
    <>
      <section className="relative overflow-hidden bg-background hero-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 home-hero-grid opacity-40"
        />
        <PageContainer className="relative py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <AnimateIn immediate delay={0}>
              <div>
                <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-6xl lg:text-7xl">
                  Jackals{" "}
                  <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                    Volleyball
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                  Train hard, play fierce. Your home for volleyball — open
                  sessions, tournaments, skills clinics, membership, and official
                  club gear.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href="/whats-on">
                    <Button variant="outline" size="lg">
                      What&apos;s on?
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="lg">Join the club</Button>
                  </Link>
                </div>
                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-8 inline-flex items-center gap-2.5 border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/10 hover:text-jackals-red-light"
                >
                  <InstagramIcon className="transition-transform group-hover:scale-110" />
                  @jackalsvolleyball
                </a>
              </div>
            </AnimateIn>

            <AnimateIn immediate delay={120} className="relative flex justify-center lg:justify-end">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-jackals-red/20 blur-3xl lg:left-auto lg:right-12 lg:translate-x-0"
              />
              <Logo
                size="hero"
                href={null}
                className="relative drop-shadow-[0_8px_48px_rgba(232,34,42,0.35)]"
              />
            </AnimateIn>
          </div>
        </PageContainer>
      </section>

      <div className="section-divider mx-auto max-w-7xl" />

      <PageContainer className="py-16 sm:py-20">
        <AnimateIn>
          <SectionHeading eyebrow="Explore" title="Everything you need" />
        </AnimateIn>
        <StaggerIn className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((item) => (
            <FeatureCard key={item.href} {...item} />
          ))}
        </StaggerIn>
      </PageContainer>

      {upcomingEvents.length > 0 && (
        <section className="relative border-y border-white/10 bg-jackals-surface-muted/60 py-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.07),transparent_70%)]"
          />
          <PageContainer className="relative py-0">
            <AnimateIn>
              <SectionHeading
                eyebrow="Don't miss out"
                title="Upcoming events"
                href="/whats-on"
                linkLabel="View all"
              />
            </AnimateIn>
            <StaggerIn className="grid gap-5 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventListCard key={event.id} event={event} />
              ))}
            </StaggerIn>
          </PageContainer>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <PageContainer className="py-16 sm:py-20">
          <AnimateIn>
            <SectionHeading
              eyebrow="Official kit"
              title="Club shop"
              href="/shop"
              linkLabel="Browse all"
            />
          </AnimateIn>
          <StaggerIn className="grid gap-5 sm:grid-cols-3">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <Card className="motion-hover-lift overflow-hidden border-white/10 p-0 group-hover:border-jackals-red/30 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <ProductPlaceholder className="h-44 transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="p-5">
                    <CardTitle>{product.name}</CardTitle>
                    <p className="mt-2 font-display text-lg font-semibold text-jackals-red-light">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </StaggerIn>
        </PageContainer>
      )}

      <InstagramFeed posts={instagramPosts} />

      {featuredAlbums.length > 0 && (
        <section className="border-t border-white/10 bg-jackals-inset/50 py-16 sm:py-20">
          <PageContainer className="py-0">
            <AnimateIn>
              <SectionHeading
                eyebrow="From the court"
                title="Gallery highlights"
                href="/gallery"
                linkLabel="View gallery"
              />
            </AnimateIn>
            <StaggerIn className="grid grid-cols-2 gap-4 md:grid-cols-4" stagger={60}>
              {featuredAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/gallery/${album.id}`}
                  className="motion-hover-lift group relative aspect-square overflow-hidden border border-white/10 bg-jackals-surface hover:border-jackals-red/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                >
                  <Image
                    src={album.coverImageUrl}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-end p-4">
                    <p className="text-sm font-medium text-white transition-colors group-hover:text-jackals-red-light">
                      {album.title}
                    </p>
                  </div>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                  />
                </Link>
              ))}
            </StaggerIn>
          </PageContainer>
        </section>
      )}
    </>
  );
}
