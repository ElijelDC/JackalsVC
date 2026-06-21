"use client";

import { Medal, Trophy } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
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
              Club{" "}
              <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                Achievements
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              Tournament results, league milestones, and moments the club has
              earned together.
            </p>
            {achievements.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
                {leagueCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-jackals-red-light" />
                    <span>
                      <span className="font-display text-2xl font-bold text-white">
                        {leagueCount}
                      </span>{" "}
                      league {leagueCount === 1 ? "title" : "titles"} won
                    </span>
                  </div>
                )}
                {tournamentCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-jackals-red-light" />
                    <span>
                      <span className="font-display text-2xl font-bold text-white">
                        {tournamentCount}
                      </span>{" "}
                      {tournamentCount === 1 ? "tournament" : "tournaments"} won
                    </span>
                  </div>
                )}
              </div>
            )}
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {achievements.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            No achievements to show yet.
          </p>
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
