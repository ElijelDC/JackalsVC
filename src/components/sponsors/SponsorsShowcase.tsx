"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Download, Mail } from "lucide-react";
import { ShowcaseCard, ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { SponsorPackagesCarousel } from "@/components/sponsors/SponsorPackagesCarousel";
import { ZoomableImage } from "@/components/sponsors/ZoomableImage";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  SPONSOR_CHAMPIONSHIP_NOTE,
  SPONSOR_HERO_STATS,
  SPONSOR_IMPACT_LINE,
  SPONSOR_PACKAGES,
  SPONSOR_PACKAGES_NOTE,
  SPONSOR_PRESENTATION_FILENAME,
  SPONSOR_PRESENTATION_URL,
  SPONSOR_WHY_POINTS,
  sponsorInquiryMailto,
} from "@/lib/sponsors-config";

type SponsorPackage = (typeof SPONSOR_PACKAGES)[number];

function DownloadPresentationButton({
  size = "lg",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <a
      href={SPONSOR_PRESENTATION_URL}
      download={SPONSOR_PRESENTATION_FILENAME}
      className={cn("inline-flex w-full sm:w-auto", className)}
    >
      <Button size={size} className="w-full gap-2 whitespace-nowrap sm:w-auto">
        <Download className="h-4 w-4 shrink-0" />
        Download club presentation
      </Button>
    </a>
  );
}

export function SponsorsShowcase() {
  const [previewPack, setPreviewPack] = useState<SponsorPackage | null>(null);
  const previewSrc =
    previewPack?.exampleFullImage ?? previewPack?.exampleImage ?? null;

  return (
    <>
      <ShowcaseHero
        title="Partner with"
        highlight="Jackals VC"
        description={
          <>
            Put your brand in front of a passionate volleyball community — league
            matchdays, training nights, tournaments, and digital channels across
            the 2026/27 season.{" "}
            <span className="text-zinc-500">{SPONSOR_CHAMPIONSHIP_NOTE}</span>
          </>
        }
        stats={SPONSOR_HERO_STATS}
      />

      <section className="relative overflow-hidden border-b border-white/10 bg-jackals-red/5 py-14 sm:py-16">
        <div
          aria-hidden
          className="motion-ambient-orb pointer-events-none absolute left-1/4 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-jackals-red/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <AnimateIn variant="pop-in">
            <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              Get the deck
            </p>
            <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
              Club presentation &amp; sponsorship proposal
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              A concise overview of the club, our audience, and how to get started —
              ideal for sharing with your marketing team.
            </p>
          </AnimateIn>
          <StaggerIn
            className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center"
            stagger={90}
            variant="pop"
          >
            <DownloadPresentationButton />
            <Link href="/sponsors/presentation" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Preview presentation
              </Button>
            </Link>
            <a href={sponsorInquiryMailto()} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
                <Mail className="h-4 w-4" />
                Email the club
              </Button>
            </a>
          </StaggerIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-12 text-center sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Why sponsor
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">
            A partnership that performs
          </h2>
        </AnimateIn>

        <StaggerIn className="grid gap-6 sm:grid-cols-2 sm:gap-7" stagger={75} variant="pop">
          {SPONSOR_WHY_POINTS.map((point) => (
            <ShowcaseCard key={point.title} title={point.title}>
              {point.description}
            </ShowcaseCard>
          ))}
        </StaggerIn>

        <AnimateIn variant="pop-in" className="mt-20 mb-12 text-center sm:mt-24 sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Packages
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">
            Sponsorship package deals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {SPONSOR_PACKAGES_NOTE}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">
            {SPONSOR_IMPACT_LINE}
          </p>
        </AnimateIn>

        <AnimateIn variant="pop-in">
          <SponsorPackagesCarousel onPreview={setPreviewPack} />
        </AnimateIn>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-zinc-500 lg:hidden">
          Swipe packages, then tap an image to open it — pinch or double-tap to
          zoom. Placeholder brand for illustration only.
        </p>
        <p className="mx-auto mt-6 hidden max-w-2xl text-center text-xs leading-relaxed text-zinc-500 lg:block">
          Click any example image to open a zoomable full-screen view —
          placeholder brand for illustration only.
        </p>

        <Modal
          open={Boolean(previewPack && previewSrc)}
          onClose={() => setPreviewPack(null)}
          variant="fullscreen"
          title={previewPack ? `${previewPack.name} example` : "Example"}
          description={
            <p className="text-sm leading-relaxed text-zinc-400">
              Pinch or double-tap to zoom, then drag to pan. Placeholder brand
              for illustration only.
            </p>
          }
        >
          {previewPack && previewSrc ? (
            <ZoomableImage
              src={previewSrc}
              alt={previewPack.exampleAlt}
              className="mx-auto w-full max-w-6xl"
            />
          ) : null}
        </Modal>

        <AnimateIn variant="spring-up" className="mt-20 sm:mt-24">
          <ShowcaseCtaBand
            className="motion-cta-glow"
            title="Ready to become a sponsor?"
            description="Ask about a 2026/27 package or email us to build a custom partnership."
          >
            <a href={sponsorInquiryMailto()} className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 whitespace-nowrap sm:w-auto">
                <Mail className="h-4 w-4 shrink-0" />
                Contact us
              </Button>
            </a>
            <Link href="/about" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 whitespace-nowrap sm:w-auto"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                About the club
              </Button>
            </Link>
          </ShowcaseCtaBand>
        </AnimateIn>
      </div>
    </>
  );
}
