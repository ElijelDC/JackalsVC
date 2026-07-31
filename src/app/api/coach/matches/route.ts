import { NextResponse } from "next/server";
import { coachOwnsTeam, requireCoach, resolveCoachWriteTeamKey } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";
import { toTeamMatchData } from "@/lib/team-match-mutations";
import { teamMatchSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const teamKey = resolveCoachWriteTeamKey(coach!, searchParams.get("team"));

  const matches = await prisma.teamMatch.findMany({
    where: { trainingTeamKey: teamKey },
    orderBy: { matchStart: "asc" },
  });

  const team = await getTrainingTeamByKey(teamKey);

  return NextResponse.json({
    matches,
    teamName: team?.name ?? coach!.teamName,
  });
}

export async function POST(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    teamMatchSchema,
  );
  if (parseError || !data) return parseError!;

  if (!coachOwnsTeam(coach!, data.trainingTeamKey)) {
    return jsonError("You can only manage matches for your assigned squads", 403);
  }

  const match = await prisma.teamMatch.create({
    data: toTeamMatchData(data),
  });

  return NextResponse.json({ match }, { status: 201 });
}
