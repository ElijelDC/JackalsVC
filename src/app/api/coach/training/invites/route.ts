import { NextResponse } from "next/server";
import { coachOwnsTeam, requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import {
  createOrGetTrainingInvite,
  getTrainingInviteEventTeamKey,
  listTrainingInvitesForEvent,
} from "@/lib/training-invites";
import { trainingInviteCreateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const eventId = new URL(request.url).searchParams.get("eventId")?.trim();
  if (!eventId) return jsonError("eventId is required", 400);

  const teamKey = await getTrainingInviteEventTeamKey(eventId);
  if (!teamKey || !coachOwnsTeam(coach!, teamKey)) {
    return jsonError("Training session not found", 404);
  }

  const invites = await listTrainingInvitesForEvent(eventId);
  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const { coach, session, response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingInviteCreateSchema,
  );
  if (parseError || !data) return parseError!;

  const teamKey = await getTrainingInviteEventTeamKey(data.eventId);
  if (!teamKey || !coachOwnsTeam(coach!, teamKey)) {
    return jsonError("Training session not found", 404);
  }

  const result = await createOrGetTrainingInvite({
    eventId: data.eventId,
    pricingType: data.pricingType,
    createdByUserId: session!.user.id,
    createdByClubMemberId: coach!.clubMemberId,
    regenerate: data.regenerate,
  });

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  return NextResponse.json(
    { invite: result.invite, created: result.created },
    { status: result.created ? 201 : 200 },
  );
}
