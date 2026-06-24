import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { handleClubMemberSquadChange, syncClubTeamsForSquadKey } from "@/lib/club-team-roster-sync";
import { isTrainingSquadKey } from "@/lib/training-squads";
import { clubMemberUpdateSchema } from "@/lib/validations";
import {
  isValidClubMemberNumberForRole,
  normalizeVlyNumber,
} from "@/lib/vly-number";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    clubMemberUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  if (
    data.trainingTeamKey !== undefined &&
    data.trainingTeamKey !== null &&
    !(await isTrainingSquadKey(data.trainingTeamKey))
  ) {
    return jsonError("Invalid squad", 400);
  }

  const existing = await prisma.clubMember.findUnique({ where: { id } });
  if (!existing) return jsonError("Roster entry not found", 404);

  const nextRosterRole = data.rosterRole ?? existing.rosterRole;
  const nextVlyNumber =
    data.vlyNumber !== undefined
      ? normalizeVlyNumber(data.vlyNumber)
      : existing.vlyNumber;

  if (!isValidClubMemberNumberForRole(nextVlyNumber, nextRosterRole)) {
    return jsonError(
      nextRosterRole === "COACH"
        ? "Enter a valid VLYC coach number (e.g. VLYC12345)"
        : "Enter a valid VLY number (e.g. VLY12345)",
      400,
    );
  }

  if (nextVlyNumber !== existing.vlyNumber) {
    const duplicate = await prisma.clubMember.findUnique({
      where: { vlyNumber: nextVlyNumber },
      select: { id: true },
    });
    if (duplicate && duplicate.id !== id) {
      return jsonError("This member number is already on the roster", 409);
    }
  }

  const nextCoachPaymentType =
    data.coachPaymentType !== undefined
      ? data.coachPaymentType
      : nextRosterRole === "COACH"
        ? (existing.coachPaymentType ?? "PAID")
        : null;

  const clubMember = await prisma.clubMember.update({
    where: { id },
    data: {
      ...(data.vlyNumber !== undefined ? { vlyNumber: nextVlyNumber } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.rosterRole !== undefined ? { rosterRole: data.rosterRole } : {}),
      ...(data.coachPaymentType !== undefined ||
      data.rosterRole !== undefined
        ? { coachPaymentType: nextCoachPaymentType }
        : {}),
      ...(data.trainingTeamKey !== undefined
        ? { trainingTeamKey: data.trainingTeamKey }
        : {}),
    },
  });

  const squadChanged =
    data.trainingTeamKey !== undefined &&
    data.trainingTeamKey !== existing.trainingTeamKey;
  const roleOrActiveChanged =
    data.rosterRole !== undefined ||
    data.active !== undefined ||
    data.name !== undefined;

  if (squadChanged) {
    await handleClubMemberSquadChange(
      id,
      existing.trainingTeamKey,
      clubMember.trainingTeamKey,
    );
  } else if (roleOrActiveChanged && clubMember.trainingTeamKey) {
    await syncClubTeamsForSquadKey(clubMember.trainingTeamKey);
  } else if (data.active === false) {
    await handleClubMemberSquadChange(
      id,
      existing.trainingTeamKey,
      null,
    );
  }

  return NextResponse.json({ clubMember });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const existing = await prisma.clubMember.findUnique({ where: { id } });
  if (!existing) return jsonError("Roster entry not found", 404);

  if (existing.userId) {
    return jsonError("Cannot delete a roster entry linked to a member account", 409);
  }

  await prisma.clubMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
