"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Download, Handshake, Mail } from "lucide-react";
import { ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  CLUB_SPONSORS,
  SPONSOR_PRESENTATION_FILENAME,
  SPONSOR_PRESENTATION_URL,
  sponsorsByTier,
  sponsorInquiryMailto,
  type ClubSponsor,
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

function SponsorCard({ sponsor }: { sponsor: ClubSponsor }) {
  return (
    <article className="motion-hover-pop motion-shine flex h-full flex-col border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex h-28 items-center justify-center bg-white px-4 py-3 sm:h-32">
        <Image
          src={sponsor.logoSrc}
          alt={`${sponsor.name} logo`}
          width={200}
          height={96}
          className="max-h-20 w-auto max-w-full object-contain sm:max-h-24"
          unoptimized
        />
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-white">
        {sponsor.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
        {sponsor.blurb}
      </p>
      <a
        href={sponsor.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-jackals-red-light transition-colors hover:text-white"
      >
        Visit sponsor
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </article>
  );
}

function EmptySponsorsState() {
  return (
    <AnimateIn variant="pop-in">
      <div className="border border-white/10 bg-white/[0.02] px-6 py-14 text-center sm:px-10 sm:py-16">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
          <Handshake className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          We&apos;re building our partner family
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Local businesses that support Jackals VC will be featured here with
          their logo and a link to their site. Be among the first to partner with
          the club for the 2026/27 season.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link href="/sponsors" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Handshake className="h-4 w-4" />
              Become a sponsor
            </Button>
          </Link>
          <a href={sponsorInquiryMailto()} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
              <Mail className="h-4 w-4" />
              Email the club
            </Button>
          </a>
        </div>
      </div>
    </AnimateIn>
  );
}

export function OurSponsorsPage() {
  const groups = sponsorsByTier(CLUB_SPONSORS);
  const hasSponsors = CLUB_SPONSORS.length > 0;

  return (
    <>
      <ShowcaseHero
        title="Our"
        highlight="Sponsors"
        description="The local businesses and organisations who support Jackals VC — helping us keep volleyball accessible, competitive, and community-first in Dublin."
        action={
          <AnimateIn
            immediate
            variant="scale-in"
            className="mb-8 flex justify-center"
          >
            <Link href="/sponsors">
              <Button variant="outline" size="lg" className="gap-2">
                <Handshake className="h-4 w-4" />
                Partner with us
              </Button>
            </Link>
          </AnimateIn>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {!hasSponsors ? (
          <EmptySponsorsState />
        ) : (
          <div className="space-y-16 sm:space-y-20">
            {groups.map((group) => (
              <section key={group.tier}>
                <AnimateIn variant="blur-in" className="mb-8 text-center sm:mb-10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                    Partners
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-bold text-white">
                    {group.label}
                  </h2>
                </AnimateIn>
                <StaggerIn
                  className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                  stagger={70}
                  variant="pop"
                >
                  {group.sponsors.map((sponsor) => (
                    <SponsorCard key={sponsor.name} sponsor={sponsor} />
                  ))}
                </StaggerIn>
              </section>
            ))}
          </div>
        )}

        <AnimateIn variant="spring-up" className="mt-20 sm:mt-24">
          <ShowcaseCtaBand
            className="motion-cta-glow"
            title="Want to see your brand here?"
            description="Club Partner packages start at €150 and include a logo and link on this page, plus social recognition across Instagram and Facebook."
          >
            <Link href="/sponsors" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 whitespace-nowrap sm:w-auto">
                <Handshake className="h-4 w-4 shrink-0" />
                View packages
              </Button>
            </Link>
            <DownloadPresentationButton className="w-full sm:w-auto" />
            <a href={sponsorInquiryMailto()} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 whitespace-nowrap sm:w-auto"
              >
                <Mail className="h-4 w-4 shrink-0" />
                Contact us
              </Button>
            </a>
          </ShowcaseCtaBand>
        </AnimateIn>
      </div>
    </>
  );
}
