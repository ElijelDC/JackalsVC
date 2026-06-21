import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import type { EventListItem } from "@/lib/event-filters";
import { getEventTypeLabel } from "@/lib/event-filters";
import {
  eventDetailPath,
  formatEventDateTime,
  getEventTypeStyle,
} from "@/lib/event-display";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageShell";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { Logo } from "@/components/layout/Logo";
import { cn, formatPrice } from "@/lib/utils";

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-jackals-red-light transition-colors hover:text-jackals-red"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

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

function UpcomingEventCard({ event }: { event: EventListItem }) {
  const style = getEventTypeStyle(event.type);
  const { dateLabel, timeLabel } = formatEventDateTime(
    event.startDate,
    event.endDate,
  );

  return (
    <Link href={eventDetailPath(event.id)} className="group block h-full">
      <Card className="motion-hover-lift relative h-full overflow-hidden border-white/10 bg-jackals-surface/90 p-0 group-hover:border-jackals-red/30 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className={cn("h-1 w-full", style.dot)} aria-hidden />
        <div className="p-6">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              style.badge,
            )}
          >
            {getEventTypeLabel(event.type)}
          </span>
          <CardTitle className="mt-3">{event.title}</CardTitle>
          <div className="mt-4 space-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
              {dateLabel}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
              {timeLabel}
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
                {event.location}
              </div>
            )}
          </div>
          <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
            View details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </Card>
    </Link>
  );
}

type Product = {
  id: string;
  name: string;
  price: number;
};

type GalleryImage = {
  id: string;
  title: string;
};

export function HomePage({
  featureItems,
  upcomingEvents,
  featuredProducts,
  featuredImages,
}: {
  featureItems: NavItem[];
  upcomingEvents: EventListItem[];
  featuredProducts: Product[];
  featuredImages: GalleryImage[];
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
                <UpcomingEventCard key={event.id} event={event} />
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

      {featuredImages.length > 0 && (
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
              {featuredImages.map((image) => (
                <Link
                  key={image.id}
                  href="/gallery"
                  className="motion-hover-lift group relative aspect-square overflow-hidden border border-white/10 bg-jackals-surface hover:border-jackals-red/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex h-full items-end p-4">
                    <p className="text-sm font-medium text-white transition-colors group-hover:text-jackals-red-light">
                      {image.title}
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
