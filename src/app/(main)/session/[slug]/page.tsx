import { notFound } from "next/navigation";
import { TrialSessionPublicView } from "@/components/trials/TrialSessionPublicView";
import { getPublicTrialSessionBySlug } from "@/lib/trial-sessions";
import { privatePageMetadata } from "@/lib/seo";
import { trialSessionPublicPath } from "@/lib/trial-session-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = trialSessionPublicPath(slug);
  const result = await getPublicTrialSessionBySlug(slug);

  if (!result.ok) {
    return privatePageMetadata("Session", path);
  }

  return privatePageMetadata(result.session.title, path);
}

export default async function OneOffSessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicTrialSessionBySlug(slug);

  if (!result.ok) {
    notFound();
  }

  return (
    <TrialSessionPublicView
      slug={slug}
      initialSession={result.session}
      initialViewerRegistered={result.viewerRegistered}
      initialViewerPendingApproval={result.viewerPendingApproval}
      initialViewerRejected={result.viewerRejected}
    />
  );
}
