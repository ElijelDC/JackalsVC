import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  handleClubMemberSquadChange,
  resolveClubMemberTrainingTeamKeys,
  serializeClubMemberForAdmin,
  setClubMemberCoachSquads,
  syncClubTeamsForSquadKey,
} from "@/lib/club-team-roster-sync";
import { isTrainingSquadKey } from "@/lib/training-squads";
import { clubMemberUpdateSchema } from "@/lib/validations";
import {
  isValidClubMemberNumberForRole,
  normalizeVlyNumber,
} from "@/lib/vly-number";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function resolveSquadKeysFromBody(data: {
  trainingTeamKey?: string | null;
  trainingTeamKeys?: string[];
}) {
  if (data.trainingTeamKeys !== undefined) {
    return data.trainingTeamKeys;
  }

  if (data.trainingTeamKey !== undefined) {
    return data.trainingTeamKey ? [data.trainingTeamKey] : [];
  }

  return null;
}

async function validateSquadKeys(keys: string[]) {
  for (const key of keys) {
    if (!(await isTrainingSquadKey(key))) {
      return false;
    }
  }
  return true;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    clubMemberUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const existing = await prisma.clubMember.findUnique({
    where: { id },
    include: { coachSquads: { select: { trainingTeamKey: true } } },
  });
  if (!existing) return jsonError("Roster entry not found", 404);

  const nextRosterRole = (data.rosterRole ?? existing.rosterRole) as "PLAYER" | "COACH";
  const nextVlyNumber =
    data.vlyNumber !== undefined
      ? normalizeVlyNumber(data.vlyNumber)
      : existing.vlyNumber;
  const squadKeysFromBody = resolveSquadKeysFromBody(data);

  if (squadKeysFromBody !== null) {
    if (!(await validateSquadKeys(squadKeysFromBody))) {
      return jsonError("Invalid squad", 400);
    }

    if (nextRosterRole === "COACH" && squadKeysFromBody.length === 0) {
      return jsonError("Coaches need at least one squad", 400);
    }

    if (nextRosterRole === "PLAYER" && squadKeysFromBody.length > 1) {
      return jsonError("Players can only belong to one squad", 400);
    }
  }

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

  const previousSquadKeys = resolveClubMemberTrainingTeamKeys(existing);

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
      ...(squadKeysFromBody !== null &&
      nextRosterRole === "PLAYER" &&
      squadKeysFromBody.length <= 1
        ? { trainingTeamKey: squadKeysFromBody[0] ?? null }
        : {}),
    },
    include: { coachSquads: { select: { trainingTeamKey: true } } },
  });

  if (nextRosterRole === "PLAYER" && existing.rosterRole === "COACH") {
    await prisma.clubMemberCoachSquad.deleteMany({ where: { clubMemberId: id } });
  }

  if (squadKeysFromBody !== null) {
    if (nextRosterRole === "COACH") {
      await setClubMemberCoachSquads(id, squadKeysFromBody);
    } else {
      await handleClubMemberSquadChange(
        id,
        existing.trainingTeamKey,
        squadKeysFromBody[0] ?? null,
      );
    }
  } else if (
    nextRosterRole === "COACH" &&
    existing.rosterRole === "PLAYER" &&
    clubMember.trainingTeamKey
  ) {
    await setClubMemberCoachSquads(id, [clubMember.trainingTeamKey]);
  }

  const updated = await prisma.clubMember.findUnique({
    where: { id },
    include: {
      coachSquads: { select: { trainingTeamKey: true } },
    },
  });

  // Keep published club teams in sync for every affected squad (coaches can have several).
  if (
    data.active !== undefined ||
    data.rosterRole !== undefined ||
    data.name !== undefined ||
    squadKeysFromBody !== null
  ) {
    const nextKeys = updated
      ? resolveClubMemberTrainingTeamKeys(updated)
      : resolveClubMemberTrainingTeamKeys(clubMember);
    const keysToSync = [...new Set([...previousSquadKeys, ...nextKeys])];
    for (const key of keysToSync) {
      await syncClubTeamsForSquadKey(key);
    }
  }

  return NextResponse.json({
    clubMember: updated ? serializeClubMemberForAdmin(updated) : clubMember,
  });
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
