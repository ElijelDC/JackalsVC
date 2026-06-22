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
import { CLUB_SLOGAN } from "@/lib/brand";
import { EditableText } from "@/components/site-edit/EditableText";
import type { InstagramPost } from "@/lib/instagram";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { FeatureCarousel } from "@/components/home/FeatureCarousel";
import type { Product } from "@/types/product";

type FeaturedAlbum = {
  id: string;
  title: string;
  coverImageUrl: string;
};

function FeatureCard({
  href,
  icon: Icon,
  label,
  description,
}: NavItem) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="motion-hover-lift relative h-full overflow-hidden border-white/10 bg-jackals-surface/80 p-5 group-hover:border-jackals-red/35 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6">
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
        <CardDescription className="mt-2 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </Card>
    </Link>
  );
}

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
            <AnimateIn immediate variant="slide-left" delay={0}>
              <div className="text-center lg:text-left">
                <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-6xl lg:text-7xl">
                  Jackals{" "}
                  <span className="motion-gradient-text bg-gradient-to-r from-jackals-red-light via-jackals-red to-jackals-red-light bg-clip-text text-transparent">
                    Volleyball
                  </span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400 lg:mx-0">
                  <EditableText
                    contentKey="home.hero.subtitle"
                    fallback={`${CLUB_SLOGAN} Your home for competitive volleyball — open sessions, tournaments, skills clinics and social activities!`}
                    label="Home hero subtitle"
                    multiline
                  />
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  <a
                    href={INSTAGRAM_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2.5 border border-white/20 bg-transparent px-6 py-3 text-base font-semibold text-white transition-all duration-300 hover:border-jackals-red/50 hover:bg-jackals-red/10 hover:scale-[1.02] active:scale-[0.96]"
                  >
                    <InstagramIcon className="transition-transform group-hover:scale-110" />
                    @jackalsvolleyball
                  </a>
                  <Link href="/events">
                    <Button size="lg">Events</Button>
                  </Link>
                </div>
              </div>
            </AnimateIn>

            <AnimateIn immediate variant="scale-in" delay={160} className="relative flex justify-center lg:justify-end">
              <div
                aria-hidden
                className="motion-hero-glow pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-jackals-red/25 blur-3xl lg:left-auto lg:right-12 lg:translate-x-0"
              />
              <Logo
                size="hero"
                href={null}
                className="motion-hero-float relative drop-shadow-[0_8px_48px_rgba(232,34,42,0.45)]"
              />
            </AnimateIn>
          </div>
        </PageContainer>
      </section>

      <div className="section-divider mx-auto max-w-7xl" />

      <PageContainer className="py-16 sm:py-20">
        <AnimateIn>
          <SectionHeading eyebrow="Explore" title="Browse Around" />
        </AnimateIn>
        <div className="md:hidden">
          <FeatureCarousel
            items={featureItems.map(({ href, label, description }) => ({
              href,
              label,
              description,
            }))}
          />
        </div>
        <StaggerIn
          className="hidden grid-cols-3 gap-5 md:grid"
          stagger={90}
        >
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
                href="/events"
                linkLabel="View all"
              />
            </AnimateIn>
            <StaggerIn className="grid gap-5 md:grid-cols-3" stagger={100}>
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
            <StaggerIn className="grid grid-cols-2 gap-4 md:grid-cols-4" stagger={80}>
              {featuredAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/gallery/${album.id}`}
                  className="motion-hover-lift group relative block overflow-hidden border border-white/10 bg-jackals-surface hover:border-jackals-red/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                >
                  <Image
                    src={album.coverImageUrl}
                    alt={album.title}
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
