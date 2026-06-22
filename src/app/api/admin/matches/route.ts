import { NextResponse } from "next/server";
import { parseJsonBody, requireAdmin } from "@/lib/api";
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

  const match = await prisma.teamMatch.create({
    data: toMatchData(data),
  });

  return NextResponse.json({ match }, { status: 201 });
}
