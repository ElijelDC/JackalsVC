import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { teamMatchSchema } from "@/lib/validations";

function toMatchData(data: {
  trainingTeamKey: string;
  opponentName: string;
  venue: string;
  location: string;
  warmUpTime: string;
  matchStart: string;
  notes?: string;
}) {
  return {
    trainingTeamKey: data.trainingTeamKey,
    opponentName: data.opponentName.trim(),
    venue: data.venue,
    location: data.location.trim(),
    warmUpTime: new Date(data.warmUpTime),
    matchStart: new Date(data.matchStart),
    notes: data.notes ?? null,
  };
}

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

  try {
    const match = await prisma.teamMatch.update({
      where: { id },
      data: toMatchData(data),
    });
    return NextResponse.json({ match });
  } catch {
    return jsonError("Match not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.teamMatch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Match not found", 404);
  }
}
