import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { syncClubTeamFromRoster } from "@/lib/club-team-roster-sync";
import { prisma } from "@/lib/prisma";

const resyncSchema = z.object({
  clearExclusions: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const team = await prisma.clubTeam.findUnique({ where: { id } });

  if (!team) {
    return jsonError("Team not found", 404);
  }

  if (!team.trainingTeamKey) {
    return jsonError("This team is not linked to a training squad.", 400);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    resyncSchema,
  );
  if (parseError) return parseError;

  if (data?.clearExclusions) {
    await prisma.clubTeam.update({
      where: { id },
      data: { syncExcludedClubMemberIds: "[]" },
    });
  }

  const result = await syncClubTeamFromRoster(id);

  const refreshedTeam = await prisma.clubTeam.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json({ result, team: refreshedTeam });
}
