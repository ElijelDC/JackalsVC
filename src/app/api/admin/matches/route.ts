import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { isTrainingSquadKey } from "@/lib/training-squads";
import { prisma } from "@/lib/prisma";
import { toTeamMatchData } from "@/lib/team-match-mutations";
import { teamMatchSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const matches = await prisma.teamMatch.findMany({
    orderBy: { matchStart: "asc" },
  });

  return NextResponse.json({ matches });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    teamMatchSchema,
  );
  if (parseError || !data) return parseError!;

  if (!(await isTrainingSquadKey(data.trainingTeamKey))) {
    return jsonError("Select a valid squad", 400);
  }

  const match = await prisma.teamMatch.create({
    data: toTeamMatchData(data),
  });

  return NextResponse.json({ match }, { status: 201 });
}
