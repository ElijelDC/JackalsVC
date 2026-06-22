import Image from "next/image";
import { Award } from "lucide-react";
import { resolveAchievementType } from "@/lib/achievements";
import { normalizeAchievementUrl } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

export type AchievementItem = {
  id: string;
  title: string;
  season: string;
  description: string;
  imageUrl: string | null;
  type: string;
};

function getTypeLabel(achievement: AchievementItem) {
  return resolveAchievementType(achievement) === "LEAGUE"
    ? "League champions"
    : "Tournament champions";
}

export function AchievementCard({
  achievement,
  index,
}: {
  achievement: AchievementItem;
  index: number;
}) {
  const imageFirst = index % 2 === 0;
  const imageUrl = achievement.imageUrl
    ? normalizeAchievementUrl(achievement.imageUrl)
    : null;

  return (
    <article className="motion-hover-lift group relative overflow-hidden border border-white/10 bg-jackals-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/40 hover:shadow-[0_24px_70px_rgba(232,34,42,0.15)]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-jackals-red/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-60"
      />

      <div
        className={cn(
          "relative grid gap-0 lg:grid-cols-2 lg:items-stretch",
          !imageFirst && imageUrl && "lg:[&>*:first-child]:order-2",
        )}
      >
        {imageUrl && (
          <div className="relative min-h-[16rem] overflow-hidden bg-black sm:min-h-[20rem] lg:min-h-full">
            <Image
              src={imageUrl}
              alt={achievement.title}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
            />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 border border-jackals-red/40 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-jackals-red-light backdrop-blur-sm">
              <Award className="h-4 w-4" />
              {getTypeLabel(achievement)}
            </div>
          </div>
        )}

        <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          {!imageUrl && (
            <div className="mb-4 inline-flex w-fit items-center gap-2 border border-jackals-red/30 bg-jackals-red/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <Award className="h-4 w-4" />
              {getTypeLabel(achievement)}
            </div>
          )}
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
            {achievement.season}
          </p>
          <h2 className="font-display mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
            {achievement.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-zinc-400">
            {achievement.description}
          </p>
        </div>
      </div>
    </article>
  );
}
