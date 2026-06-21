import { NextResponse } from "next/server";
import { parseJsonBody, requireAdmin } from "@/lib/api";
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

  const team = await prisma.clubTeam.create({
    data: {
      name: data.name,
      level: data.level,
      description: data.description,
      details: data.details ?? null,
      sortOrder: data.sortOrder,
    },
  });
  return NextResponse.json({ team }, { status: 201 });
}
