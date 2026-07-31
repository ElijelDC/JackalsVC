import { NextResponse } from "next/server";
import { coachOwnsTeam, requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  applyTeamMatchDeleteAction,
  toTeamMatchData,
} from "@/lib/team-match-mutations";
import { teamMatchSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.teamMatch.findUnique({ where: { id } });
  if (!existing || !coachOwnsTeam(coach!, existing.trainingTeamKey)) {
    return jsonError("Match not found", 404);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    teamMatchSchema,
  );
  if (parseError || !data) return parseError!;

  if (!coachOwnsTeam(coach!, data.trainingTeamKey)) {
    return jsonError("You can only manage matches for your assigned squads", 403);
  }

  const match = await prisma.teamMatch.update({
    where: { id },
    data: toTeamMatchData(data),
  });

  return NextResponse.json({ match });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.teamMatch.findUnique({ where: { id } });
  if (!existing || !coachOwnsTeam(coach!, existing.trainingTeamKey)) {
    return jsonError("Match not found", 404);
  }

  const { searchParams } = new URL(request.url);
  await applyTeamMatchDeleteAction(id, searchParams.get("action"));
  return NextResponse.json({ success: true });
}
