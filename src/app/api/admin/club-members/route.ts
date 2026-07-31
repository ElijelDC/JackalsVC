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
  normalizeVlyNumber,
} from "@/lib/vly-number";
import { clubMemberCreateSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const clubMembers = await prisma.clubMember.findMany({
    include: {
      user: { select: { id: true, email: true } },
      coachSquads: { select: { trainingTeamKey: true } },
    },
    orderBy: { vlyNumber: "asc" },
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

  const vlyNumber = normalizeVlyNumber(data.vlyNumber);
  if (!isValidClubMemberNumberForRole(vlyNumber, data.rosterRole)) {
    return jsonError(
      data.rosterRole === "COACH"
        ? "Enter a valid VLYC coach number (e.g. VLYC12345)"
        : "Enter a valid VLY number (e.g. VLY12345)",
      400,
    );
  }

  const squadKeys =
    data.trainingTeamKeys ??
    (data.trainingTeamKey ? [data.trainingTeamKey] : []);

  if (squadKeys.length === 0) {
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

  const existing = await prisma.clubMember.findUnique({ where: { vlyNumber } });
  if (existing) {
    return jsonError("This member number is already on the roster", 409);
  }

  const clubMember = await prisma.clubMember.create({
    data: {
      vlyNumber,
      name: data.name.trim(),
      trainingTeamKey: squadKeys[0],
      rosterRole: data.rosterRole,
      coachPaymentType:
        data.rosterRole === "COACH" ? (data.coachPaymentType ?? "PAID") : null,
      active: data.active ?? true,
    },
    include: { coachSquads: { select: { trainingTeamKey: true } } },
  });

  if (data.rosterRole === "COACH") {
    await setClubMemberCoachSquads(clubMember.id, squadKeys);
  } else {
    await syncClubTeamsForSquadKey(squadKeys[0]);
  }

  const created = await prisma.clubMember.findUnique({
    where: { id: clubMember.id },
    include: {
      user: { select: { id: true, email: true } },
      coachSquads: { select: { trainingTeamKey: true } },
    },
  });

  return NextResponse.json(
    { clubMember: created ? serializeClubMemberForAdmin(created) : clubMember },
    { status: 201 },
  );
}
