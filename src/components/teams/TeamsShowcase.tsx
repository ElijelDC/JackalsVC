"use client";

import { GraduationCap, Shield, Volleyball } from "lucide-react";
import Link from "next/link";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeamCard, type TeamCardData } from "@/components/teams/TeamCard";
import { countTeamMembers } from "@/lib/teams";
import { SEO_COPY } from "@/lib/seo";

export function TeamsShowcase({ teams }: { teams: TeamCardData[] }) {
  const totalCoachCount = teams.reduce(
    (sum, team) => sum + countTeamMembers(team.members).coaches,
    0,
  );
  const totalPlayerCount = teams.reduce(
    (sum, team) => sum + countTeamMembers(team.members).players,
    0,
  );

  return (
    <>
      <ShowcaseHero
        title="Our"
        highlight="Teams"
        description="Competitive Irish National League squads and club teams based in Dublin — find the right fit for your level and goals."
        statsGridClassName="grid-cols-3 gap-x-2 gap-y-6 sm:gap-x-8 sm:gap-y-10"
        stats={
          teams.length > 0
            ? [
                {
                  icon: Shield,
                  value: teams.length,
                  label: teams.length === 1 ? "team" : "teams",
                },
                ...(totalCoachCount > 0
                  ? [
                      {
                        icon: GraduationCap,
                        value: totalCoachCount,
                        label: totalCoachCount === 1 ? "coach" : "coaches",
                      },
                    ]
                  : []),
                ...(totalPlayerCount > 0
                  ? [
                      {
                        icon: Volleyball,
                        value: totalPlayerCount,
                        label: totalPlayerCount === 1 ? "player" : "players",
                      },
                    ]
                  : []),
              ]
            : undefined
        }
      />

      <section className="border-b border-white/10 bg-jackals-inset/20 py-10 sm:py-12">
        <AnimateIn className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
            {SEO_COPY.teamsIntro}
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            New player?{" "}
            <Link href="/events" className="font-semibold text-jackals-red-light hover:underline">
              Browse open sessions
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="font-semibold text-jackals-red-light hover:underline">
              contact us
            </Link>{" "}
            to ask about joining a squad.
          </p>
        </AnimateIn>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {teams.length === 0 ? (
          <AnimateIn>
            <EmptyState
              title="Teams coming soon"
              description="Squads and sessions will be listed here once they are published."
            />
          </AnimateIn>
        ) : (
          <StaggerIn className="grid gap-6 md:grid-cols-2" stagger={120}>
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </StaggerIn>
        )}
      </div>
    </>
  );
}
