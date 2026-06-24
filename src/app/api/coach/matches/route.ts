import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toTeamMatchData } from "@/lib/team-match-mutations";
import { teamMatchSchema } from "@/lib/validations";

export async function GET() {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const matches = await prisma.teamMatch.findMany({
    where: { trainingTeamKey: coach!.trainingTeamKey },
    orderBy: { matchStart: "asc" },
  });

  return NextResponse.json({ matches, teamName: coach!.teamName });
}

export async function POST(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    teamMatchSchema,
  );
  if (parseError || !data) return parseError!;

  if (data.trainingTeamKey !== coach!.trainingTeamKey) {
    return jsonError("You can only manage matches for your assigned squad", 403);
  }

  const match = await prisma.teamMatch.create({
    data: toTeamMatchData({
      ...data,
      trainingTeamKey: coach!.trainingTeamKey,
    }),
  });

  return NextResponse.json({ match }, { status: 201 });
}
