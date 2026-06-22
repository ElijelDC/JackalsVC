"use client";

import Link from "next/link";
import { BookOpen, Download, Mail, Sparkles } from "lucide-react";
import { ShowcaseCard, ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  SPONSOR_HERO_STATS,
  SPONSOR_PRESENTATION_FILENAME,
  SPONSOR_PRESENTATION_URL,
  SPONSOR_VISIBILITY_CHANNELS,
  SPONSOR_WHY_POINTS,
  sponsorInquiryMailto,
} from "@/lib/sponsors-config";

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
  return (
    <>
      <ShowcaseHero
        title="Partner with"
        highlight="Jackals VC"
        description="Put your brand in front of a passionate volleyball community — league matchdays, training nights, tournaments, and digital channels across the 2026/27 season."
        stats={SPONSOR_HERO_STATS.map((stat) => ({
          icon: Sparkles,
          value: stat.value,
          label: stat.label,
        }))}
      />

      <section className="border-b border-white/10 bg-jackals-red/5 py-12 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <AnimateIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              Club presentation
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              Club presentation &amp; sponsorship proposal
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              A concise overview of the club, our audience, and how to get started —
              ideal for sharing with your marketing team.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <AnimateIn className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Why sponsor
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white">
            A partnership that performs
          </h2>
        </AnimateIn>

        <StaggerIn className="grid gap-5 sm:grid-cols-2" stagger={90}>
          {SPONSOR_WHY_POINTS.map((point) => (
            <ShowcaseCard key={point.title} title={point.title}>
              {point.description}
            </ShowcaseCard>
          ))}
        </StaggerIn>

        <AnimateIn className="mt-16 mb-10 text-center sm:mt-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Visibility
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white">
            Where your brand appears
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400">
            Multiple touchpoints across the season — from the court to Instagram to
            our club website.
          </p>
        </AnimateIn>

        <StaggerIn
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
          stagger={70}
        >
          {SPONSOR_VISIBILITY_CHANNELS.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="motion-hover-lift h-full border border-white/10 bg-white/[0.02] p-3 sm:p-5"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse sm:mb-3 sm:h-10 sm:w-10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="font-display text-sm font-semibold leading-snug text-white sm:text-lg">
                {title}
              </h3>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-400 sm:mt-2 sm:line-clamp-none sm:text-sm">
                {description}
              </p>
            </article>
          ))}
        </StaggerIn>

        <AnimateIn className="mt-16 sm:mt-20">
          <ShowcaseCtaBand
            title="Ready to become a sponsor?"
            description="Download the presentation or email us to discuss a partnership for the 2026/27 season."
          >
            <DownloadPresentationButton className="w-full sm:w-auto" />
            <a href={sponsorInquiryMailto()} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full gap-2 whitespace-nowrap sm:w-auto">
                <Mail className="h-4 w-4 shrink-0" />
                Contact us
              </Button>
            </a>
            <Link href="/about" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full gap-2 whitespace-nowrap sm:w-auto">
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
