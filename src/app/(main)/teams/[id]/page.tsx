import { notFound } from "next/navigation";
import { TeamDetailView } from "@/components/teams/TeamDetailView";
import { getPublicTeamById } from "@/lib/public-page-data";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getPublicTeamById(id);
  if (!team) {
    return pageMetadata({ title: "Team", path: `/teams/${id}` });
  }

  return pageMetadata({
    title: team.name,
    description: `${team.name} — ${team.level} squad at Jackals Volleyball Club, Dublin. ${team.description}`,
    path: `/teams/${id}`,
  });
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getPublicTeamById(id);

  if (!team) {
    notFound();
  }

  return <TeamDetailView team={team} />;
}
