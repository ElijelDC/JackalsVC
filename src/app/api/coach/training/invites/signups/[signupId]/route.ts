import { NextResponse } from "next/server";
import { coachOwnsTeam, requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  getSignupInviteEventTeamKey,
  setTrainingInviteSignupStatus,
} from "@/lib/training-invites";
import { trainingInviteSignupStatusSchema } from "@/lib/validations";
import { isTrainingInviteSignupStatus } from "@/lib/training-invite-types";

async function authorizeSignupReview(signupId: string) {
  const { signup, trainingTeamKey, eventId } =
    await getSignupInviteEventTeamKey(signupId);

  if (!signup || !trainingTeamKey || !eventId) {
    return { ok: false as const, response: jsonError("Registration not found", 404) };
  }

  const admin = await requireAdmin();
  if (!admin.response && admin.session) {
    return {
      ok: true as const,
      reviewedByUserId: admin.session.user.id,
      eventId,
    };
  }

  const { coach, session, response } = await requireCoach();
  if (response || !coach || !session) {
    return { ok: false as const, response: response ?? jsonError("Forbidden", 403) };
  }

  if (!coachOwnsTeam(coach, trainingTeamKey)) {
    return { ok: false as const, response: jsonError("Registration not found", 404) };
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
