"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CLUB_SLOGAN_PARTS } from "@/lib/brand";
import { ShowcaseCard, ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";

const OFFERINGS = [
  "High-standard weekly training for league members",
  "Fun sessions and tournaments open to everyone",
  "Skills clinics throughout the season",
  "Competitive teams with good vibes on and off court",
];

const VALUES = [
  {
    title: "Show up for each other",
    description:
      "Respect, effort, and team spirit come first. Every session is a chance to improve, compete, and belong.",
  },
  {
    title: "True team sport",
    description:
      "We celebrate big wins and small moments — cheering from the sideline, helping a teammate nail a new skill, welcoming newcomers.",
  },
  {
    title: "High standard, good vibes",
    description:
      "Push hard in training, play fair in matches, and leave the court knowing you gave your best. Fun is always part of the mix.",
  },
  {
    title: "Built on community",
    description:
      "League competition, social play, or somewhere in between — you are part of something bigger than one session or one result.",
  },
];

function AboutFeatureCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ShowcaseCard title={title} className={className}>
      {children}
    </ShowcaseCard>
  );
}

function ValueCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="motion-hover-lift relative h-full overflow-hidden border border-white/10 bg-jackals-surface/80 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
    </article>
  );
}

export function AboutShowcase() {
  return (
    <>
      <ShowcaseHero
        title="About"
        highlight="Jackals VC"
        description="A community volleyball club built around open sessions, competitive training, and a welcoming team spirit."
      />

      <section className="relative border-b border-white/10 bg-jackals-inset/30 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="scale-in" className="text-center">
            <p className="font-display mx-auto max-w-3xl text-2xl font-bold tracking-wide text-white sm:text-3xl">
              {CLUB_SLOGAN_PARTS.lead}{" "}
              <span className="text-jackals-red-light">{CLUB_SLOGAN_PARTS.accent}</span>{" "}
              {CLUB_SLOGAN_PARTS.tail}
            </p>
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <StaggerIn className="grid gap-6 lg:grid-cols-2" stagger={100}>
          <AboutFeatureCard title="Who we are">
            <p>
              Jackals VC is a community volleyball club built around open sessions,
              competitive training, and a welcoming team spirit. Whether you are
              picking up a ball for the first time or chasing league titles, there
              is a place for you here.
            </p>
          </AboutFeatureCard>

          <AboutFeatureCard title="What we offer">
            <ul className="space-y-3">
              {OFFERINGS.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jackals-red-light"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </AboutFeatureCard>
        </StaggerIn>

        <AnimateIn className="mt-16 sm:mt-20">
          <h2 className="font-display mb-8 text-center text-3xl font-bold text-white sm:text-4xl">
            Our values
          </h2>
          <StaggerIn className="grid gap-4 sm:grid-cols-2" stagger={90}>
            {VALUES.map((value) => (
              <ValueCard key={value.title} {...value} />
            ))}
          </StaggerIn>
        </AnimateIn>

        <AnimateIn className="mt-16 sm:mt-20">
          <ShowcaseCtaBand
            title="Ready to see what we are about?"
            description="Browse open events, meet our squads, or get in touch — we would love to hear from you."
          >
            <Link href="/whats-on" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                What&apos;s on?
              </Button>
            </Link>
            <Link href="/teams" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Our teams
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Contact us
              </Button>
            </Link>
          </ShowcaseCtaBand>
        </AnimateIn>
      </div>
    </>
  );
}
