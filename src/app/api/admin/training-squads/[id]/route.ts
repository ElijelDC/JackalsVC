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

  // Hard blockers: players / schedule data must be moved first.
  if (usage.members > 0 || usage.sessions > 0 || usage.matches > 0) {
    const parts: string[] = [];
    if (usage.members > 0) {
      parts.push(
        `${usage.members} roster member${usage.members === 1 ? "" : "s"}`,
      );
    }
    if (usage.sessions > 0) {
      parts.push(
        `${usage.sessions} training session${usage.sessions === 1 ? "" : "s"}`,
      );
    }
    if (usage.matches > 0) {
      parts.push(`${usage.matches} match${usage.matches === 1 ? "" : "es"}`);
    }
    return jsonError(
      `This squad is still linked to ${parts.join(", ")}. Reassign those first, or deactivate the squad instead of deleting.`,
      409,
    );
  }

  // Soft links (coach covers + synced club teams) can be cleared safely.
  await prisma.$transaction(async (tx) => {
    await tx.clubMemberCoachSquad.deleteMany({
      where: { trainingTeamKey: existing.key },
    });
    await tx.clubTeam.updateMany({
      where: { trainingTeamKey: existing.key },
      data: { trainingTeamKey: null },
    });
    await tx.trainingSquad.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
