import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { isTrainingSquadKey } from "@/lib/training-squads";
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
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    teamMatchSchema,
  );
  if (parseError || !data) return parseError!;

  if (!(await isTrainingSquadKey(data.trainingTeamKey))) {
    return jsonError("Select a valid squad", 400);
  }

  try {
    const match = await prisma.teamMatch.update({
      where: { id },
      data: toTeamMatchData(data),
    });
    return NextResponse.json({ match });
  } catch {
    return jsonError("Match not found", 404);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  try {
    await applyTeamMatchDeleteAction(id, searchParams.get("action"));
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Match not found", 404);
  }
}
