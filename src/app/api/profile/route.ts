import { NextResponse } from "next/server";
import { jsonError, requireClubMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  isValidClubMemberNumberForRole,
  normalizeVlyNumber,
} from "@/lib/vly-number";
import {
  profilePlayerNumberSchema,
  profileVlyNumberSchema,
} from "@/lib/validations";

const profileSelect = {
  id: true,
  vlyNumber: true,
  vlyMembershipPhotoUrl: true,
  playerNumber: true,
  rosterRole: true,
} as const;

export async function PATCH(request: Request) {
  const { clubMember, response } = await requireClubMember();
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonError("Invalid request body.", 400);
  }

  if ("vlyNumber" in body) {
    const parsed = profileVlyNumberSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid VLY number.",
        400,
      );
    }

    const rosterRole = (clubMember!.rosterRole === "COACH"
      ? "COACH"
      : "PLAYER") as "PLAYER" | "COACH";
    const vlyNumber = normalizeVlyNumber(parsed.data.vlyNumber);

    if (!isValidClubMemberNumberForRole(vlyNumber, rosterRole)) {
      return jsonError(
        rosterRole === "COACH"
          ? "Enter a valid VLYC coach number (e.g. VLYC12345)."
          : "Enter a valid VLY number (e.g. VLY12345).",
        400,
      );
    }

    if (vlyNumber === clubMember!.vlyNumber) {
      return NextResponse.json({
        id: clubMember!.id,
        vlyNumber: clubMember!.vlyNumber,
        vlyMembershipPhotoUrl: clubMember!.vlyMembershipPhotoUrl,
        playerNumber: clubMember!.playerNumber,
        rosterRole: clubMember!.rosterRole,
      });
    }

    const duplicate = await prisma.clubMember.findUnique({
      where: { vlyNumber },
      select: { id: true },
    });
    if (duplicate && duplicate.id !== clubMember!.id) {
      return jsonError(
        rosterRole === "COACH"
          ? "That VLYC number is already used on the roster."
          : "That VLY number is already used on the roster.",
        409,
      );
    }

    const updated = await prisma.clubMember.update({
      where: { id: clubMember!.id },
      data: { vlyNumber },
      select: profileSelect,
    });

    return NextResponse.json(updated);
  }

  if ("playerNumber" in body) {
    const parsed = profilePlayerNumberSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid player number.",
        400,
      );
    }

    if (clubMember!.rosterRole === "COACH") {
      return jsonError("Coaches do not have in-game player numbers.", 400);
    }

    const updated = await prisma.clubMember.update({
      where: { id: clubMember!.id },
      data: { playerNumber: parsed.data.playerNumber },
      select: profileSelect,
    });

    return NextResponse.json(updated);
  }

  return jsonError("Nothing to update.", 400);
}
