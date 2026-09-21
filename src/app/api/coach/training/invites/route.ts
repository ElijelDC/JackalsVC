import { NextResponse } from "next/server";
import { getCoachProfile } from "@/lib/coach-auth";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  createOrGetTrainingInvite,
  getTrainingInviteEventTeamKey,
  listTrainingInvitesForEvent,
  userCanManageTrainingGuestInvites,
} from "@/lib/training-invites";
import { trainingInviteCreateSchema } from "@/lib/validations";

async function authorizeGuestInviteManager(eventId: string) {
  const { session, response } = await requireSession();
  if (response || !session?.user?.id) {
    return { ok: false as const, response: response ?? jsonError("Unauthorized", 401) };
  }

  const teamKey = await getTrainingInviteEventTeamKey(eventId);
  if (!teamKey) {
    return { ok: false as const, response: jsonError("Training session not found", 404) };
  }

  const canManage = await userCanManageTrainingGuestInvites(
    session.user.id,
    teamKey,
  );
  if (!canManage) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }

  return { ok: true as const, session, teamKey };
}

export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get("eventId")?.trim();
  if (!eventId) return jsonError("eventId is required", 400);

  const authz = await authorizeGuestInviteManager(eventId);
  if (!authz.ok) return authz.response;

  const invites = await listTrainingInvitesForEvent(eventId);
  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingInviteCreateSchema,
  );
  if (parseError || !data) return parseError!;

  const authz = await authorizeGuestInviteManager(data.eventId);
  if (!authz.ok) return authz.response;

  const coach = await getCoachProfile(authz.session.user.id);

  const result = await createOrGetTrainingInvite({
    eventId: data.eventId,
    pricingType: data.pricingType,
    createdByUserId: authz.session.user.id,
    createdByClubMemberId: coach?.clubMemberId ?? null,
    regenerate: data.regenerate,
    sessionFeeEur: data.sessionFeeEur,
  });

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  return NextResponse.json(
    { invite: result.invite, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}
