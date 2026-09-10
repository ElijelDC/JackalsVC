import { getSiteContentMap } from "@/lib/site-content";
import { getTrainingSquads } from "@/lib/training-squads";
import {
  readAllTeamVodPlaylists,
} from "@/lib/vod-playlists";
import { VodPlaylistsManager } from "@/components/admin/VodPlaylistsManager";

export const metadata = {
  title: "Admin · YouTube playlists",
};

export default async function AdminVodPlaylistsPage() {
  const [squads, content] = await Promise.all([
    getTrainingSquads(),
    getSiteContentMap(),
  ]);

  const initialPlaylists = readAllTeamVodPlaylists(
    content,
    squads.map((squad) => ({ key: squad.key, name: squad.name })),
  );

  return <VodPlaylistsManager initialPlaylists={initialPlaylists} />;
}
