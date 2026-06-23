import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireClubMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profilePlayerNumberSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const { clubMember, response } = await requireClubMember();
  if (response) return response;

  const { data, response: parseResponse } = await parseJsonBody(
    request,
    profilePlayerNumberSchema,
    "Invalid player number.",
  );
  if (parseResponse) return parseResponse;

  if (clubMember!.rosterRole === "COACH") {
    return jsonError("Coaches do not have in-game player numbers.", 400);
  }

  const updated = await prisma.clubMember.update({
    where: { id: clubMember!.id },
    data: { playerNumber: data!.playerNumber },
    select: {
      id: true,
      vlyMembershipPhotoUrl: true,
      playerNumber: true,
    },
  });

  return NextResponse.json(updated);
}
