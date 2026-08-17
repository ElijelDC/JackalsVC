import "server-only";

import { prisma } from "@/lib/prisma";
import { deleteTrialSessionPaymentProofFile } from "@/lib/trial-session-payment-proof";
import { trialSessionPaymentProofExpiryCutoff } from "@/lib/trial-session-types";

export type TrialSessionProofCleanupResult = {
  expired: number;
  deleted: number;
};

export async function purgeExpiredTrialSessionPaymentProofs(
  now: Date = new Date(),
): Promise<TrialSessionProofCleanupResult> {
  const cutoff = trialSessionPaymentProofExpiryCutoff(now);
  const proofs = await prisma.trialSessionPaymentProof.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, proofScreenshotUrl: true },
  });

  for (const proof of proofs) {
    await deleteTrialSessionPaymentProofFile(proof.proofScreenshotUrl);
  }

  if (proofs.length === 0) {
    return { expired: 0, deleted: 0 };
  }

  const deleted = await prisma.trialSessionPaymentProof.deleteMany({
    where: { id: { in: proofs.map((proof) => proof.id) } },
  });

  return { expired: proofs.length, deleted: deleted.count };
}
