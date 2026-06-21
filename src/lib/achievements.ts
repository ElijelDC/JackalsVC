export type AchievementType = "LEAGUE" | "TOURNAMENT";

export function resolveAchievementType(achievement: {
  type?: string | null;
  title: string;
  description: string;
}): AchievementType {
  if (achievement.type === "LEAGUE" || achievement.type === "TOURNAMENT") {
    return achievement.type;
  }

  if (
    /national league|division 3/i.test(
      `${achievement.title} ${achievement.description}`,
    )
  ) {
    return "LEAGUE";
  }

  return "TOURNAMENT";
}

export function countAchievementsByType(
  achievements: Array<{
    type?: string | null;
    title: string;
    description: string;
  }>,
) {
  return achievements.reduce(
    (counts, achievement) => {
      const type = resolveAchievementType(achievement);
      if (type === "LEAGUE") {
        counts.league += 1;
      } else {
        counts.tournament += 1;
      }
      return counts;
    },
    { league: 0, tournament: 0 },
  );
}
