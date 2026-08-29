"use client";

import Image from "next/image";
import { ShowcaseCard, ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { TrialsApplicationButton } from "@/components/trials/TrialsApplicationForm";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import {
  TRIALS_BENEFITS,
  TRIALS_LOOKING_FOR,
} from "@/lib/trials-recruitment-config";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export function TrialsRecruitmentShowcase() {
  return (
    <>
      <ShowcaseHero
        title="Trials"
        highlight="Open"
        description={
          <>
            <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
              August 2026 National League trials
            </span>
            Jackals Volleyball is holding trials for our Men&apos;s Division 2,
            Men&apos;s Division 3, and Women&apos;s Division 3 teams in August.
            If you&apos;re ready to compete in the Irish National League with a
            committed Dublin based Volleyball Club, we want to hear from you.
          </>
        }
        action={
          <AnimateIn immediate variant="scale-in" className="mb-8 flex justify-center">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <Image
                src={PUBLIC_PATHS.brand.logoTransparent}
                alt="Jackals Volleyball Club"
                fill
                className="object-contain"
                priority
              />
            </div>
          </AnimateIn>
        }
      />

      <section className="relative overflow-hidden border-b border-white/10 bg-jackals-red/5 py-14 sm:py-16">
        <div
          aria-hidden
          className="motion-ambient-orb pointer-events-none absolute right-1/4 top-0 h-40 w-40 rounded-full bg-jackals-red/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <AnimateIn variant="pop-in">
            <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              Keen to trial with us?
            </p>
            <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
              Register your interest
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Tell us about your experience and preferred positions. It only
              takes a few minutes — we&apos;ll follow up with trial details by
              email.
            </p>
          </AnimateIn>
          <StaggerIn
            className="mt-10 flex justify-center"
            stagger={90}
            variant="pop"
          >
            <TrialsApplicationButton className="gap-2" />
          </StaggerIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-12 text-center sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Why trial with Jackals
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">
            What&apos;s on offer
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Full-court training, National League competition, and a committed
            Dublin club behind you.
          </p>
        </AnimateIn>

        <StaggerIn
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          stagger={60}
          variant="pop"
        >
          {TRIALS_BENEFITS.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="motion-hover-pop motion-shine h-full border border-white/10 bg-white/[0.02] p-4 sm:p-6"
            >
              <div className="motion-icon-pop mb-3 flex h-9 w-9 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse sm:h-10 sm:w-10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="font-display text-base font-semibold leading-snug text-white sm:text-lg">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            </article>
          ))}
        </StaggerIn>

        <AnimateIn variant="spring-up" className="mt-16 sm:mt-20">
          <ShowcaseCard title="Who we're looking for">
            <ul className="space-y-3">
              {TRIALS_LOOKING_FOR.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 bg-jackals-red-light"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ShowcaseCard>
        </AnimateIn>

        <AnimateIn variant="spring-up" className="mt-12 sm:mt-16">
          <ShowcaseCtaBand
            className="motion-cta-glow"
            title="Ready for August trials?"
            description="Submit the quick form below — we'll share dates, venues, and next steps by email."
          >
            <TrialsApplicationButton className="w-full gap-2 whitespace-nowrap sm:w-auto" />
          </ShowcaseCtaBand>
        </AnimateIn>
      </div>
    </>
  );
}
