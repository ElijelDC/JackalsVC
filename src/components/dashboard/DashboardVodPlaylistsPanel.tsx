"use client";

import { Clapperboard, ExternalLink, Play, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { TeamVodPlaylists } from "@/lib/vod-playlists";
import { cn } from "@/lib/utils";

function PlaylistLinkCard({
  href,
  title,
  shortTitle,
  subtitle,
  icon: Icon,
  accentClass,
}: {
  href: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: typeof Play;
  accentClass: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 transition-colors sm:items-start sm:gap-3 sm:p-4",
        "hover:border-jackals-red/30 hover:bg-jackals-red/[0.04]",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 sm:h-10 sm:w-10",
          accentClass,
        )}
      >
        <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-semibold text-white sm:text-sm">
          <span className="sm:hidden">{shortTitle}</span>
          <span className="hidden sm:inline">{title}</span>
        </p>
        <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">{subtitle}</p>
      </div>
      <ExternalLink className="h-3 w-3 shrink-0 text-zinc-600 transition-colors group-hover:text-jackals-red-light sm:mt-1 sm:h-3.5 sm:w-3.5" />
    </a>
  );
}

export function DashboardVodPlaylistsPanel({
  playlists,
  className,
}: {
  playlists: TeamVodPlaylists | null;
  className?: string;
}) {
  const trainingUrl = playlists?.trainingUrl?.trim() || null;
  const matchesUrl = playlists?.matchesUrl?.trim() || null;
  const teamLabel = playlists?.teamName ?? "Your squad";

  return (
    <section className={cn("@container/dash-tile flex h-full min-w-0 flex-col", className)}>
      <div className="mb-2.5 sm:mb-4">
        <h2 className="font-display text-base font-semibold text-white sm:text-xl">
          <span className="@[14rem]/dash-tile:hidden">Videos</span>
          <span className="hidden @[14rem]/dash-tile:inline">Video library</span>
        </h2>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 sm:text-xs">
          YouTube · {teamLabel}
        </p>
      </div>

      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
        {!trainingUrl && !matchesUrl ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2.5 py-4 text-center sm:px-5 sm:py-5">
            <Clapperboard className="h-5 w-5 text-zinc-600 sm:h-6 sm:w-6" />
            <p className="text-[11px] leading-snug text-zinc-500 sm:text-sm">
              Playlists not set yet
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-start gap-2 p-2 sm:gap-3 sm:p-4">
            {trainingUrl ? (
              <PlaylistLinkCard
                href={trainingUrl}
                title="VOD Training"
                shortTitle="Training"
                subtitle="Training clips & sessions"
                icon={Play}
                accentClass="bg-jackals-red/15 text-jackals-red-light"
              />
            ) : null}
            {matchesUrl ? (
              <PlaylistLinkCard
                href={matchesUrl}
                title="Match playlist"
                shortTitle="Matches"
                subtitle="Match footage & highlights"
                icon={Trophy}
                accentClass="bg-sky-500/15 text-sky-300"
              />
            ) : null}
          </div>
        )}
      </Card>
    </section>
  );
}
