import { notFound } from "next/navigation";
import { TrainingInvitePublicView } from "@/components/training/TrainingInvitePublicView";
import { getClubBankDetails } from "@/lib/payments";
import { getPublicTrainingInviteByToken } from "@/lib/training-invites";
import { privatePageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getPublicTrainingInviteByToken(token);

  if (!result.ok) {
    return privatePageMetadata("Training invite");
  }

  return privatePageMetadata(result.invite.title);
}

export default async function TrainingInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getPublicTrainingInviteByToken(token);

  if (!result.ok) {
    notFound();
  }

  return (
    <TrainingInvitePublicView
      token={token}
      initialInvite={result.invite}
      clubBank={getClubBankDetails()}
      initialViewerRegistered={result.viewerRegistered}
      initialViewerPendingApproval={result.viewerPendingApproval}
      initialViewerRejected={result.viewerRejected}
    />
  );
}
