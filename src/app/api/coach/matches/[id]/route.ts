import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { teamMatchSchema } from "@/lib/validations";

function toMatchData(
  trainingTeamKey: string,
  data: {
    opponentName: string;
    venue: string;
    location: string;
    warmUpTime: string;
    matchStart: string;
    notes?: string;
  },
) {
  return {
    trainingTeamKey,
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
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.teamMatch.findUnique({ where: { id } });
  if (!existing || existing.trainingTeamKey !== coach!.trainingTeamKey) {
    return jsonError("Match not found", 404);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    teamMatchSchema,
  );
  if (parseError || !data) return parseError!;

  if (data.trainingTeamKey !== coach!.trainingTeamKey) {
    return jsonError("You can only manage matches for your assigned squad", 403);
  }

  const match = await prisma.teamMatch.update({
    where: { id },
    data: toMatchData(coach!.trainingTeamKey, data),
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
  if (!existing || existing.trainingTeamKey !== coach!.trainingTeamKey) {
    return jsonError("Match not found", 404);
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "cancel") {
    await prisma.teamMatch.update({
      where: { id },
      data: { cancelled: true },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "restore") {
    await prisma.teamMatch.update({
      where: { id },
      data: { cancelled: false },
    });
    return NextResponse.json({ success: true });
  }

  await prisma.teamMatch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
