"use client";

import { Shield, Users } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { TeamCard, type TeamCardData } from "@/components/teams/TeamCard";
import { countTeamMembers } from "@/lib/teams";

export function TeamsShowcase({ teams }: { teams: TeamCardData[] }) {
  const totalMembers = teams.reduce(
    (sum, team) => sum + countTeamMembers(team.members).total,
    0,
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background hero-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.18),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 home-hero-grid opacity-30"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <AnimateIn immediate className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-5xl lg:text-6xl">
              Our{" "}
              <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                Teams
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              From competitive league squads to open social play — find the right
              fit for your level and goals.
            </p>

            {teams.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-jackals-red-light" />
                  <span>
                    <span className="font-display text-2xl font-bold text-white">
                      {teams.length}
                    </span>{" "}
                    {teams.length === 1 ? "team" : "teams"}
                  </span>
                </div>
                {totalMembers > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-jackals-red-light" />
                    <span>
                      <span className="font-display text-2xl font-bold text-white">
                        {totalMembers}
                      </span>{" "}
                      squad {totalMembers === 1 ? "member" : "members"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {teams.length === 0 ? (
          <AnimateIn>
            <div className="relative overflow-hidden border border-dashed border-white/15 bg-jackals-surface/40 px-8 py-16 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(232,34,42,0.08),transparent_70%)]"
              />
              <Shield className="relative mx-auto h-10 w-10 text-jackals-red-light/60" />
              <p className="relative mt-4 font-display text-lg font-semibold text-white">
                Teams coming soon
              </p>
              <p className="relative mt-2 text-sm text-zinc-500">
                Squads and sessions will be listed here once they are published.
              </p>
            </div>
          </AnimateIn>
        ) : (
          <StaggerIn className="grid gap-6 md:grid-cols-2" stagger={100}>
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </StaggerIn>
        )}
      </div>
    </>
  );
}
