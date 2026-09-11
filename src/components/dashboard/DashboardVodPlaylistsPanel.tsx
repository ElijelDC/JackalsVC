"use client";

import type { ReactNode } from "react";
import { Clapperboard, ExternalLink, Play, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  DashboardTileHeader,
  DashboardTileSlots,
  DASHBOARD_TILE_CARD_CLASS,
  DASHBOARD_TILE_FOOTER_CLASS,
} from "@/components/dashboard/DashboardUpcomingScheduleCard";
import type { TeamVodPlaylists } from "@/lib/vod-playlists";
import { cn } from "@/lib/utils";

function PlaylistRow({
  href,
  label,
  description,
  icon: Icon,
  accentClass,
}: {
  href: string;
  label: string;
  description: string;
  icon: typeof Play;
  accentClass: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-h-0 items-center gap-2.5 px-2.5 transition-colors hover:bg-white/[0.03] sm:gap-3 sm:px-3"
    >
      <div
        className={cn(
          "flex h-10 w-8 shrink-0 items-center justify-center rounded",
          accentClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-snug text-white sm:text-[13px]">
          {label}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-400 sm:text-[11px]">
          {description}
        </p>
      </div>
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
  const primaryUrl = trainingUrl ?? matchesUrl;

  const rows: ReactNode[] = [];
  if (trainingUrl) {
    rows.push(
      <PlaylistRow
        key="training"
        href={trainingUrl}
        label="Training clips"
        description="Session footage and drills for your squad"
        icon={Play}
        accentClass="bg-jackals-red/15 text-jackals-red-light"
      />,
    );
  }
  if (matchesUrl) {
    rows.push(
      <PlaylistRow
        key="matches"
        href={matchesUrl}
        label="Match footage"
        description="Game film and highlights from fixtures"
        icon={Trophy}
        accentClass="bg-sky-500/15 text-sky-300"
      />,
    );
  }

  return (
    <section className={cn("flex h-full min-w-0 flex-col", className)}>
      <DashboardTileHeader
        icon={Clapperboard}
        title="Video library"
        shortTitle="Videos"
        subtitle={teamLabel}
      />

      <Card className={DASHBOARD_TILE_CARD_CLASS}>
        {rows.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-3 py-5 text-center text-xs text-zinc-500">
            Playlists not set yet
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <DashboardTileSlots>{rows}</DashboardTileSlots>
            {primaryUrl ? (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={DASHBOARD_TILE_FOOTER_CLASS}
              >
                Open playlists
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        )}
      </Card>
    </section>
  );
}
