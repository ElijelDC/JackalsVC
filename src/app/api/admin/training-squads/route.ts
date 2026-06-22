import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  getTrainingSquadUsageCounts,
  slugifyTrainingSquadKey,
} from "@/lib/training-squads";
import { trainingSquadCreateSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const squads = await prisma.trainingSquad.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ squads });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingSquadCreateSchema,
  );
  if (parseError || !data) return parseError!;

  const key = data.key?.trim() || slugifyTrainingSquadKey(data.name);
  const existing = await prisma.trainingSquad.findUnique({ where: { key } });
  if (existing) {
    return jsonError("A squad with this key already exists", 409);
  }

  const squad = await prisma.trainingSquad.create({
    data: {
      key,
      name: data.name.trim(),
      dayOfWeek: data.dayOfWeek,
      sortOrder: data.sortOrder,
      active: data.active,
    },
  });

  return NextResponse.json({ squad }, { status: 201 });
}
