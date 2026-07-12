import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  parseSyncExcludedClubMemberIds,
  serializeSyncExcludedClubMemberIds,
} from "@/lib/club-team-roster-sync";
import { prisma } from "@/lib/prisma";
import {
  clubTeamMemberDisplaySchema,
  clubTeamMemberSchema,
} from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { memberId } = await params;

  const existing = await prisma.clubTeamMember.findUnique({
    where: { id: memberId },
  });
  if (!existing) return jsonError("Team member not found", 404);

  try {
    if (existing.clubMemberId) {
      const { data, response: parseError } = await parseJsonBody(
        request,
        clubTeamMemberDisplaySchema,
      );
      if (parseError || !data) return parseError!;

      const member = await prisma.clubTeamMember.update({
        where: { id: memberId },
        data: {
          ...(data.position !== undefined
            ? { position: data.position ?? null }
            : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(data.isCaptain !== undefined ? { isCaptain: data.isCaptain } : {}),
          ...(data.hidden !== undefined ? { hidden: data.hidden } : {}),
        },
      });
      return NextResponse.json({ member });
    }

    const { data, response: parseError } = await parseJsonBody(
      request,
      clubTeamMemberSchema,
    );
    if (parseError || !data) return parseError!;

    const member = await prisma.clubTeamMember.update({
      where: { id: memberId },
      data: {
        name: data.name,
        role: data.role,
        position: data.position ?? null,
        photoUrl: data.photoUrl ?? null,
        sortOrder: data.sortOrder,
        isCaptain: data.isCaptain ?? false,
        hidden: data.hidden ?? false,
      },
    });
    return NextResponse.json({ member });
  } catch (error) {
    console.error("Failed to update team member:", error);
    return jsonError("Failed to update team member", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { memberId } = await params;

  const existing = await prisma.clubTeamMember.findUnique({
    where: { id: memberId },
    include: { team: true },
  });
  if (!existing) return jsonError("Team member not found", 404);

  if (existing.clubMemberId && existing.team.trainingTeamKey) {
    const excluded = parseSyncExcludedClubMemberIds(
      existing.team.syncExcludedClubMemberIds,
    );

    if (!excluded.includes(existing.clubMemberId)) {
      await prisma.clubTeam.update({
        where: { id: existing.teamId },
        data: {
          syncExcludedClubMemberIds: serializeSyncExcludedClubMemberIds([
            ...excluded,
            existing.clubMemberId,
          ]),
        },
      });
    }
  }

  await prisma.clubTeamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
