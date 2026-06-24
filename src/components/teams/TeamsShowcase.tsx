"use client";

import { Shield, Users } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeamCard, type TeamCardData } from "@/components/teams/TeamCard";
import { countTeamMembers } from "@/lib/teams";

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
        description="From competitive league squads to open social play — find the right fit for your level and goals."
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
                        icon: Users,
                        value: totalCoachCount,
                        label: totalCoachCount === 1 ? "coach" : "coaches",
                      },
                    ]
                  : []),
                ...(totalPlayerCount > 0
                  ? [
                      {
                        icon: Users,
                        value: totalPlayerCount,
                        label: totalPlayerCount === 1 ? "player" : "players",
                      },
                    ]
                  : []),
              ]
            : undefined
        }
      />

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
