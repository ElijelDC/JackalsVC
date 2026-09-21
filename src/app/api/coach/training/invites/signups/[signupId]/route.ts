import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  getSignupInviteEventTeamKey,
  removeTrainingInviteSignup,
  setTrainingInviteSignupStatus,
  userCanManageTrainingGuestInvites,
} from "@/lib/training-invites";
import { trainingInviteSignupStatusSchema } from "@/lib/validations";
import { isTrainingInviteSignupStatus } from "@/lib/training-invite-types";

async function authorizeSignupReview(signupId: string) {
  const { signup, trainingTeamKey, eventId } =
    await getSignupInviteEventTeamKey(signupId);

  if (!signup || !trainingTeamKey || !eventId) {
    return { ok: false as const, response: jsonError("Registration not found", 404) };
  }

  const { session, response } = await requireSession();
  if (response || !session?.user?.id) {
    return { ok: false as const, response: response ?? jsonError("Unauthorized", 401) };
  }

  const canManage = await userCanManageTrainingGuestInvites(
    session.user.id,
    trainingTeamKey,
  );
  if (!canManage) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }

  return {
    ok: true as const,
    reviewedByUserId: session.user.id,
    eventId,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ signupId: string }> },
) {
  const { signupId } = await params;
  const authz = await authorizeSignupReview(signupId);
  if (!authz.ok) return authz.response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingInviteSignupStatusSchema,
  );
  if (parseError || !data) return parseError!;

  if (!isTrainingInviteSignupStatus(data.status)) {
    return jsonError("Invalid status", 400);
  }

  const result = await setTrainingInviteSignupStatus({
    signupId,
    status: data.status,
    reviewedByUserId: authz.reviewedByUserId,
    eventId: authz.eventId,
  });

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ signup: result.signup });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ signupId: string }> },
) {
  const { signupId } = await params;
  const authz = await authorizeSignupReview(signupId);
  if (!authz.ok) return authz.response;

  const result = await removeTrainingInviteSignup({
    signupId,
    eventId: authz.eventId,
  });

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ success: true });
}
