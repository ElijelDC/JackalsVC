import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  serializeClubMemberForAdmin,
  setClubMemberCoachSquads,
  syncClubTeamsForSquadKey,
} from "@/lib/club-team-roster-sync";
import { isTrainingSquadKey } from "@/lib/training-squads";
import {
  isValidClubMemberNumberForRole,
  normalizeOptionalVlyNumber,
} from "@/lib/vly-number";
import { clubMemberCreateSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const clubMembers = await prisma.clubMember.findMany({
    include: {
      user: { select: { id: true, email: true } },
      coachSquads: { select: { trainingTeamKey: true, priority: true } },
    },
    orderBy: [{ vlyNumber: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    clubMembers: clubMembers.map(serializeClubMemberForAdmin),
  });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    clubMemberCreateSchema,
  );
  if (parseError || !data) return parseError!;

  const vlyNumber = normalizeOptionalVlyNumber(data.vlyNumber ?? null);
  if (
    vlyNumber !== null &&
    !isValidClubMemberNumberForRole(vlyNumber, data.rosterRole)
  ) {
    return jsonError(
      data.rosterRole === "COACH"
        ? "Enter a valid VLYC coach number (e.g. VLYC12345), or leave blank for now"
        : "Enter a valid VLY number (e.g. VLY12345), or leave blank for now",
      400,
    );
  }

  const squadKeys =
    data.trainingTeamKeys ??
    (data.trainingTeamKey ? [data.trainingTeamKey] : []);

  if (data.rosterRole === "PLAYER" && squadKeys.length === 0) {
    return jsonError("Select a valid squad", 400);
  }

  for (const key of squadKeys) {
    if (!(await isTrainingSquadKey(key))) {
      return jsonError("Select a valid squad", 400);
    }
  }

  if (data.rosterRole === "PLAYER" && squadKeys.length > 1) {
    return jsonError("Players can only belong to one squad", 400);
  }

  if (vlyNumber !== null) {
    const existing = await prisma.clubMember.findUnique({
      where: { vlyNumber },
    });
    if (existing) {
      return jsonError("This member number is already on the roster", 409);
    }
  }

  const clubMember = await prisma.clubMember.create({
    data: {
      vlyNumber,
      name: data.name.trim(),
      trainingTeamKey: squadKeys[0] ?? null,
      rosterRole: data.rosterRole,
      coachPaymentType:
        data.rosterRole === "COACH" ? (data.coachPaymentType ?? "PAID") : null,
      active: data.active ?? true,
    },
    include: {
      coachSquads: { select: { trainingTeamKey: true, priority: true } },
    },
  });

  if (data.rosterRole === "COACH") {
    await setClubMemberCoachSquads(
      clubMember.id,
      squadKeys,
      data.coachSquadPriorities,
    );
  } else if (squadKeys[0]) {
    await syncClubTeamsForSquadKey(squadKeys[0]);
  }

  const created = await prisma.clubMember.findUnique({
    where: { id: clubMember.id },
    include: {
      user: { select: { id: true, email: true } },
      coachSquads: { select: { trainingTeamKey: true, priority: true } },
    },
  });

  return NextResponse.json(
    { clubMember: created ? serializeClubMemberForAdmin(created) : clubMember },
    { status: 201 },
  );
}
