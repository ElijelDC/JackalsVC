import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  adminAddTrialSessionSignup,
  setTrialSessionSignupStatuses,
} from "@/lib/trial-sessions";
import {
  isTrialSessionSignupStatus,
  trialSessionPublicPath,
} from "@/lib/trial-session-types";
import { adminTrialSessionAddSignupSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const bulkUpdateSignupStatusSchema = z.object({
  signupIds: z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

async function revalidateTrialSessionViews(trialSessionId: string) {
  const session = await prisma.trialSession.findUnique({
    where: { id: trialSessionId },
    select: { slug: true },
  });

  if (!session) return;

  revalidatePath("/admin");
  revalidatePath("/admin/one-off-sessions");
  revalidatePath("/admin/trial-sessions");
  revalidatePath(trialSessionPublicPath(session.slug));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    adminTrialSessionAddSignupSchema,
  );
  if (parseError || !data) return parseError!;

  const result = await adminAddTrialSessionSignup(id, data);

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  await revalidateTrialSessionViews(id);

  return NextResponse.json({
    signup: result.signup,
    message: result.message,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    bulkUpdateSignupStatusSchema,
  );
  if (parseError || !data) return parseError!;

  if (!isTrialSessionSignupStatus(data.status)) {
    return jsonError("Invalid signup status.", 400);
  }

  const result = await setTrialSessionSignupStatuses(
    id,
    data.signupIds,
    data.status,
  );

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  await revalidateTrialSessionViews(id);

  const count = result.updatedCount;
  const noun = count === 1 ? "request" : "requests";
  const message =
    data.status === "APPROVED"
      ? `Approved ${count} ${noun} and sent confirmation emails.`
      : data.status === "REJECTED"
        ? `Rejected ${count} ${noun}.`
        : `Moved ${count} ${noun} back to awaiting approval.`;

  return NextResponse.json({ updatedCount: count, message });
}
