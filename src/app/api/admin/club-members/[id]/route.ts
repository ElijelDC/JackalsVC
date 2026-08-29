import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  handleClubMemberSquadChange,
  resolveClubMemberTrainingTeamKeys,
  serializeClubMemberForAdmin,
  setClubMemberCoachSquads,
  syncClubTeamsForSquadKey,
} from "@/lib/club-team-roster-sync";
import { clubMemberUpdateSchema } from "@/lib/validations";
import {
  isValidClubMemberNumberForRole,
  normalizeOptionalVlyNumber,
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

/**
 * Unknown keys fail. Newly added keys must be active.
 * Already-assigned inactive keys are allowed so edits don't break when a squad
 * was deactivated (e.g. old Regional / DIV4 after creating Division 3 Mens).
 */
async function validateSquadKeys(
  keys: string[],
  previousKeys: string[] = [],
) {
  const previous = new Set(previousKeys);
  for (const key of keys) {
    const squad = await prisma.trainingSquad.findUnique({
      where: { key },
      select: { active: true },
    });
    if (!squad) return false;
    if (!squad.active && !previous.has(key)) return false;
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
    include: {
      coachSquads: { select: { trainingTeamKey: true, priority: true } },
    },
  });
  if (!existing) return jsonError("Roster entry not found", 404);

  const nextRosterRole = (data.rosterRole ?? existing.rosterRole) as "PLAYER" | "COACH";
  let nextVlyNumber =
    data.vlyNumber !== undefined
      ? normalizeOptionalVlyNumber(data.vlyNumber)
      : existing.vlyNumber;
  const previousSquadKeys = resolveClubMemberTrainingTeamKeys(existing);
  const squadKeysFromBody = resolveSquadKeysFromBody(data);

  // Changing role with an incompatible stored number (e.g. VLY → coach): clear it.
  if (
    data.rosterRole !== undefined &&
    data.vlyNumber === undefined &&
    nextVlyNumber !== null &&
    !isValidClubMemberNumberForRole(nextVlyNumber, nextRosterRole)
  ) {
    nextVlyNumber = null;
  }

  if (squadKeysFromBody !== null) {
    if (!(await validateSquadKeys(squadKeysFromBody, previousSquadKeys))) {
      return jsonError("Invalid squad", 400);
    }

    if (nextRosterRole === "PLAYER" && squadKeysFromBody.length > 1) {
      return jsonError("Players can only belong to one squad", 400);
    }
  }

  // Only validate format when the client is explicitly setting the number.
  // Do not block squad / role / other edits on a legacy mismatched value.
  if (
    data.vlyNumber !== undefined &&
    nextVlyNumber !== null &&
    !isValidClubMemberNumberForRole(nextVlyNumber, nextRosterRole)
  ) {
    return jsonError(
      nextRosterRole === "COACH"
        ? "Enter a valid VLYC coach number (e.g. VLYC12345), or leave blank for now"
        : "Enter a valid VLY number (e.g. VLY12345), or leave blank for now",
      400,
    );
  }

  if (nextVlyNumber !== existing.vlyNumber && nextVlyNumber !== null) {
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

  const vlyNumberChanged = nextVlyNumber !== existing.vlyNumber;

  const clubMember = await prisma.clubMember.update({
    where: { id },
    data: {
      ...(data.vlyNumber !== undefined || vlyNumberChanged
        ? { vlyNumber: nextVlyNumber }
        : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.rosterRole !== undefined ? { rosterRole: data.rosterRole } : {}),
      ...(data.rosterRole === "COACH" ? { playerNumber: null } : {}),
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
    include: {
      coachSquads: { select: { trainingTeamKey: true, priority: true } },
    },
  });

  if (nextRosterRole === "PLAYER" && existing.rosterRole === "COACH") {
    await prisma.clubMemberCoachSquad.deleteMany({ where: { clubMemberId: id } });
  }

  if (squadKeysFromBody !== null) {
    if (nextRosterRole === "COACH") {
      await setClubMemberCoachSquads(
        id,
        squadKeysFromBody,
        data.coachSquadPriorities,
      );
    } else {
      await handleClubMemberSquadChange(
        id,
        existing.trainingTeamKey,
        squadKeysFromBody[0] ?? null,
      );
    }
  } else if (nextRosterRole === "COACH" && data.coachSquadPriorities) {
    const keys = resolveClubMemberTrainingTeamKeys({
      ...existing,
      rosterRole: nextRosterRole,
    });
    if (keys.length > 0) {
      await setClubMemberCoachSquads(id, keys, data.coachSquadPriorities);
    }
  } else if (
    nextRosterRole === "COACH" &&
    existing.rosterRole === "PLAYER" &&
    clubMember.trainingTeamKey
  ) {
    await setClubMemberCoachSquads(
      id,
      [clubMember.trainingTeamKey],
      data.coachSquadPriorities,
    );
  }

  const updated = await prisma.clubMember.findUnique({
    where: { id },
    include: {
      coachSquads: { select: { trainingTeamKey: true, priority: true } },
    },
  });

  // Squad handlers already sync published teams. Re-sync only for non-squad field edits.
  if (
    squadKeysFromBody === null &&
    (data.active !== undefined ||
      data.rosterRole !== undefined ||
      data.name !== undefined)
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
