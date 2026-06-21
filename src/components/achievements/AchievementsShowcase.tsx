"use client";

import { Medal, Trophy } from "lucide-react";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AchievementCard,
  type AchievementItem,
} from "@/components/achievements/AchievementCard";
import { countAchievementsByType } from "@/lib/achievements";

export function AchievementsShowcase({
  achievements,
}: {
  achievements: AchievementItem[];
}) {
  const { league: leagueCount, tournament: tournamentCount } =
    countAchievementsByType(achievements);

  const stats = [];
  if (leagueCount > 0) {
    stats.push({
      icon: Trophy,
      value: leagueCount,
      label: `league ${leagueCount === 1 ? "title" : "titles"} won`,
    });
  }
  if (tournamentCount > 0) {
    stats.push({
      icon: Medal,
      value: tournamentCount,
      label: `${tournamentCount === 1 ? "tournament" : "tournaments"} won`,
    });
  }

  return (
    <>
      <ShowcaseHero
        title="Club"
        highlight="Achievements"
        description="Tournament results, league milestones, and moments the club has earned together."
        stats={stats.length > 0 ? stats : undefined}
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {achievements.length === 0 ? (
          <EmptyState title="No achievements to show yet." />
        ) : (
          <StaggerIn className="flex flex-col gap-10 sm:gap-12" stagger={120}>
            {achievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </StaggerIn>
        )}
      </div>
    </>
  );
}
