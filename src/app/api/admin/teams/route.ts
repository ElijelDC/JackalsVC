import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { syncClubTeamFromRoster } from "@/lib/club-team-roster-sync";
import { isTrainingSquadKey } from "@/lib/training-squads";
import { prisma } from "@/lib/prisma";
import { clubTeamSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const teams = await prisma.clubTeam.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ teams });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    clubTeamSchema,
  );
  if (parseError || !data) return parseError!;

  if (data.trainingTeamKey && !(await isTrainingSquadKey(data.trainingTeamKey))) {
    return jsonError("Select a valid squad", 400);
  }

  const team = await prisma.clubTeam.create({
    data: {
      name: data.name,
      level: data.level,
      description: data.description,
      details: data.details ?? null,
      trainingTeamKey: data.trainingTeamKey,
      sortOrder: data.sortOrder,
    },
  });

  if (team.trainingTeamKey) {
    await syncClubTeamFromRoster(team.id);
  }

  return NextResponse.json({ team }, { status: 201 });
}
