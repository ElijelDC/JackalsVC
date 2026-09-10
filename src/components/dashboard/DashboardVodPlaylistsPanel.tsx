"use client";

import { Clapperboard, ExternalLink, Play, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { TeamVodPlaylists } from "@/lib/vod-playlists";
import { cn } from "@/lib/utils";

function PlaylistLinkCard({
  href,
  title,
  subtitle,
  icon: Icon,
  accentClass,
}: {
  href: string;
  title: string;
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
        "group flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 transition-colors sm:p-4",
        "hover:border-jackals-red/30 hover:bg-jackals-red/[0.04]",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 sm:h-10 sm:w-10",
          accentClass,
        )}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      </div>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors group-hover:text-jackals-red-light" />
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
      <div className="mb-3 sm:mb-4">
        <h2 className="font-display text-lg font-semibold text-white sm:text-xl">
          Video library
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          YouTube playlists · {teamLabel}
        </p>
      </div>

      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
        {!trainingUrl && !matchesUrl ? (
          <div className="flex flex-1 items-center gap-3 px-4 py-3.5 sm:justify-center sm:px-5 sm:py-5 sm:text-center">
            <Clapperboard className="h-5 w-5 shrink-0 text-zinc-600 sm:hidden" />
            <div className="min-w-0 sm:flex sm:flex-col sm:items-center sm:gap-2">
              <Clapperboard className="hidden h-6 w-6 text-zinc-600 sm:block" />
              <p className="text-sm text-zinc-500">
                Playlists for your squad aren&apos;t set yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-start gap-2 p-3 sm:gap-3 sm:p-4">
            {trainingUrl ? (
              <PlaylistLinkCard
                href={trainingUrl}
                title="VOD Training"
                subtitle="Training clips & sessions"
                icon={Play}
                accentClass="bg-jackals-red/15 text-jackals-red-light"
              />
            ) : null}
            {matchesUrl ? (
              <PlaylistLinkCard
                href={matchesUrl}
                title="Match playlist"
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
