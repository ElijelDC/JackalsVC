import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { clubTeamMemberSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id: teamId } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    clubTeamMemberSchema,
  );
  if (parseError || !data) return parseError!;

  const team = await prisma.clubTeam.findUnique({ where: { id: teamId } });
  if (!team) {
    return jsonError("Team not found", 404);
  }

  if (team.trainingTeamKey && data.role === "PLAYER") {
    return jsonError(
      "Players are added automatically from the club roster. Assign members on the roster page instead.",
      400,
    );
  }

  const member = await prisma.clubTeamMember.create({
    data: {
      teamId,
      name: data.name,
      role: data.role,
      position: data.position ?? null,
      photoUrl: data.photoUrl ?? null,
      sortOrder: data.sortOrder,
      isCaptain: data.isCaptain ?? false,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}
