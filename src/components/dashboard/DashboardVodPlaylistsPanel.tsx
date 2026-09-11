"use client";

import type { ReactNode } from "react";
import { Clapperboard, ExternalLink, Play, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  DashboardTileHeader,
  DashboardTileSlots,
  DASHBOARD_TILE_CARD_CLASS,
} from "@/components/dashboard/DashboardUpcomingScheduleCard";
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
      className="group flex h-full min-h-0 items-center gap-2.5 px-3 transition-colors hover:bg-white/[0.03] sm:gap-3 sm:px-3.5"
    >
      <div
        className={cn(
          "flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-white/10",
          accentClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-white sm:text-sm">
        {label}
      </p>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors group-hover:text-jackals-red-light" />
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
  const rows = [
    trainingUrl ? (
      <PlaylistRow
        key="training"
        href={trainingUrl}
        label="Training clips"
        icon={Play}
        accentClass="bg-jackals-red/15 text-jackals-red-light"
      />
    ) : null,
    matchesUrl ? (
      <PlaylistRow
        key="matches"
        href={matchesUrl}
        label="Match footage"
        icon={Trophy}
        accentClass="bg-sky-500/15 text-sky-300"
      />
    ) : null,
  ].filter(Boolean) as React.ReactNode[];

  return (
    <section className={cn("flex h-full min-w-0 flex-col", className)}>
      <DashboardTileHeader
        icon={Clapperboard}
        title="Video library"
        shortTitle="Videos"
        subtitle={teamLabel}
      />

      <Card className={DASHBOARD_TILE_CARD_CLASS}>
        {!trainingUrl && !matchesUrl ? (
          <p className="flex flex-1 items-center justify-center px-3 py-5 text-center text-xs text-zinc-500">
            Playlists not set yet
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <DashboardTileSlots>{rows}</DashboardTileSlots>
            {/* Spacer matches View all footer height on sibling tiles */}
            <div className="h-9 shrink-0 border-t border-white/10" aria-hidden />
          </div>
        )}
      </Card>
    </section>
  );
}
