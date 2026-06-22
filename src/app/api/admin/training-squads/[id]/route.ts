import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getTrainingSquadUsageCounts } from "@/lib/training-squads";
import { trainingSquadUpdateSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingSquadUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const existing = await prisma.trainingSquad.findUnique({ where: { id } });
  if (!existing) return jsonError("Squad not found", 404);

  const squad = await prisma.trainingSquad.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.dayOfWeek !== undefined ? { dayOfWeek: data.dayOfWeek } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });

  return NextResponse.json({ squad });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const existing = await prisma.trainingSquad.findUnique({ where: { id } });
  if (!existing) return jsonError("Squad not found", 404);

  const usage = await getTrainingSquadUsageCounts(existing.key);
  if (usage.total > 0) {
    return jsonError(
      "This squad is in use on the roster, training schedule, or matches. Deactivate it instead of deleting.",
      409,
    );
  }

  await prisma.trainingSquad.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
