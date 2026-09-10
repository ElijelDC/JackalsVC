import type { SiteContentMap } from "@/lib/site-content";

export type VodPlaylistKind = "training" | "matches";

export type TeamVodPlaylists = {
  trainingTeamKey: string;
  teamName: string;
  trainingUrl: string | null;
  matchesUrl: string | null;
};

export function vodPlaylistContentKey(
  trainingTeamKey: string,
  kind: VodPlaylistKind,
) {
  return `vod.playlist.${trainingTeamKey}.${kind}`;
}

export function isLikelyYoutubeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

export function readTeamVodPlaylists(
  map: SiteContentMap,
  trainingTeamKey: string,
  teamName: string,
): TeamVodPlaylists {
  const training = map[vodPlaylistContentKey(trainingTeamKey, "training")]?.trim();
  const matches = map[vodPlaylistContentKey(trainingTeamKey, "matches")]?.trim();
  return {
    trainingTeamKey,
    teamName,
    trainingUrl: training || null,
    matchesUrl: matches || null,
  };
}

export function readAllTeamVodPlaylists(
  map: SiteContentMap,
  teams: Array<{ key: string; name: string }>,
): TeamVodPlaylists[] {
  return teams.map((team) =>
    readTeamVodPlaylists(map, team.key, team.name),
  );
}

export function teamHasAnyVodPlaylist(playlists: TeamVodPlaylists | null | undefined) {
  return Boolean(playlists?.trainingUrl || playlists?.matchesUrl);
}
