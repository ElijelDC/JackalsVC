"use client";

import { Clapperboard, ExternalLink, Play, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DashboardTileHeader } from "@/components/dashboard/DashboardUpcomingScheduleCard";
import type { TeamVodPlaylists } from "@/lib/vod-playlists";
import { cn } from "@/lib/utils";

function PlaylistRow({
  href,
  label,
  icon: Icon,
  accentClass,
}: {
  href: string;
  label: string;
  icon: typeof Play;
  accentClass: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2 px-2.5 py-2.5 transition-colors hover:bg-white/[0.03] sm:items-center sm:gap-2.5 sm:px-3"
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 sm:h-9 sm:w-9",
          accentClass,
        )}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <p className="min-w-0 flex-1 pt-0.5 text-[13px] font-medium leading-snug text-white sm:pt-0 sm:text-sm">
        {label}
      </p>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors group-hover:text-jackals-red-light sm:mt-0" />
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
    <section className={cn("flex h-full min-w-0 flex-col", className)}>
      <DashboardTileHeader
        icon={Clapperboard}
        title="Video library"
        shortTitle="Videos"
        subtitle={teamLabel}
      />

      <Card className="flex min-h-[14.5rem] min-w-0 flex-1 flex-col overflow-hidden p-0 sm:min-h-[16rem]">
        {!trainingUrl && !matchesUrl ? (
          <p className="flex flex-1 items-center justify-center px-3 py-5 text-center text-xs text-zinc-500">
            Playlists not set yet
          </p>
        ) : (
          <div className="flex flex-1 flex-col divide-y divide-white/10">
            {trainingUrl ? (
              <PlaylistRow
                href={trainingUrl}
                label="Training clips"
                icon={Play}
                accentClass="bg-jackals-red/15 text-jackals-red-light"
              />
            ) : null}
            {matchesUrl ? (
              <PlaylistRow
                href={matchesUrl}
                label="Match footage"
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
