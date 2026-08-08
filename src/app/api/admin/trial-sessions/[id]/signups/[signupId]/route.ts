import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  removeTrialSessionSignup,
  setTrialSessionSignupStatus,
} from "@/lib/trial-sessions";
import {
  isTrialSessionSignupStatus,
  trialSessionPublicPath,
} from "@/lib/trial-session-types";

const updateSignupStatusSchema = z.object({
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

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; signupId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, signupId } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    updateSignupStatusSchema,
  );
  if (parseError || !data) return parseError!;

  if (!isTrialSessionSignupStatus(data.status)) {
    return jsonError("Invalid signup status.", 400);
  }

  const result = await setTrialSessionSignupStatus(id, signupId, data.status);

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  await revalidateTrialSessionViews(id);

  return NextResponse.json({
    signup: result.signup,
    message:
      data.status === "APPROVED"
        ? "Attendee approved."
        : data.status === "REJECTED"
          ? "Request rejected."
          : "Moved back to awaiting approval.",
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; signupId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, signupId } = await params;
  const result = await removeTrialSessionSignup(id, signupId);

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  await revalidateTrialSessionViews(id);

  return NextResponse.json({ success: true });
}
