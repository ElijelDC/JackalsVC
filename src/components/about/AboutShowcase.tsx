"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CLUB_SLOGAN_PARTS } from "@/lib/brand";
import { EditableText } from "@/components/site-edit/EditableText";
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

function ValueCard({
  title,
  description,
  titleKey,
  descriptionKey,
}: {
  title: string;
  description: string;
  titleKey: string;
  descriptionKey: string;
}) {
  return (
    <article className="motion-hover-lift relative h-full overflow-hidden border border-white/10 bg-jackals-surface/80 p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold text-white">
        <EditableText contentKey={titleKey} fallback={title} label="Value title" />
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        <EditableText
          contentKey={descriptionKey}
          fallback={description}
          label="Value description"
          multiline
        />
      </p>
    </article>
  );
}

export function AboutShowcase() {
  return (
    <>
      <ShowcaseHero
        title="About"
        highlight="Jackals VC"
        description={
          <EditableText
            contentKey="about.hero.description"
            fallback="An amateur sports club built around community volleyball — open sessions, competitive training, and a welcoming team spirit."
            label="About hero description"
            multiline
          />
        }
      />

      <section className="relative border-b border-white/10 bg-jackals-inset/30 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateIn variant="scale-in" className="text-center">
            <div className="mx-auto w-full max-w-3xl overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="font-display whitespace-nowrap text-[clamp(0.75rem,3.2vw,1.875rem)] font-bold tracking-tight text-white sm:text-3xl sm:tracking-wide">
                <EditableText
                  contentKey="brand.slogan.lead"
                  fallback={CLUB_SLOGAN_PARTS.lead}
                  label="Slogan (lead)"
                />{" "}
                <span className="text-jackals-red-light">
                  <EditableText
                    contentKey="brand.slogan.accent"
                    fallback={CLUB_SLOGAN_PARTS.accent}
                    label="Slogan (accent)"
                  />
                </span>{" "}
                <EditableText
                  contentKey="brand.slogan.tail"
                  fallback={CLUB_SLOGAN_PARTS.tail}
                  label="Slogan (tail)"
                />
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <StaggerIn className="grid gap-6 lg:grid-cols-2" stagger={100}>
          <AboutFeatureCard title="Who we are">
            <p>
              <EditableText
                contentKey="about.who-we-are"
                fallback="Founded in 2024, Jackals VC is an amateur sports club built around community volleyball — open sessions, competitive training, and a welcoming team spirit. Whether you are picking up a ball for the first time or chasing league titles, there is a place for you here."
                label="Who we are"
                multiline
              />
            </p>
          </AboutFeatureCard>

          <AboutFeatureCard title="What we offer">
            <ul className="space-y-3">
              {OFFERINGS.map((item, index) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jackals-red-light"
                  />
                  <span>
                    <EditableText
                      contentKey={`about.offerings.${index}`}
                      fallback={item}
                      label={`Offering ${index + 1}`}
                    />
                  </span>
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
            {VALUES.map((value, index) => (
              <ValueCard
                key={value.title}
                {...value}
                titleKey={`about.values.${index}.title`}
                descriptionKey={`about.values.${index}.description`}
              />
            ))}
          </StaggerIn>
        </AnimateIn>

        <AnimateIn className="mt-16 sm:mt-20">
          <ShowcaseCtaBand
            title="Ready to see what we are about?"
            description={
              <EditableText
                contentKey="about.cta.description"
                fallback="Browse open events, meet our squads, or get in touch — we would love to hear from you."
                label="About CTA description"
                multiline
              />
            }
          >
            <Link href="/events" className="w-full sm:w-auto">
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
