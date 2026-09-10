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
        "group flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-colors",
        "hover:border-jackals-red/30 hover:bg-jackals-red/[0.04]",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10",
          accentClass,
        )}
      >
        <Icon className="h-5 w-5" />
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

  if (!trainingUrl && !matchesUrl) {
    return (
      <section className={cn("min-w-0", className)}>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-white">
            Video library
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            YouTube playlists · {teamLabel}
          </p>
        </div>
        <Card className="flex min-h-[140px] flex-col items-center justify-center gap-2 p-6 text-center">
          <Clapperboard className="h-7 w-7 text-zinc-600" />
          <p className="text-sm text-zinc-500">
            Playlists for your squad aren&apos;t set yet.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Video library
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          YouTube playlists · {teamLabel}
        </p>
      </div>
      <div className="space-y-3">
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
    </section>
  );
}
