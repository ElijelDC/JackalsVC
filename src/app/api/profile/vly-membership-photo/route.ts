import { NextResponse } from "next/server";
import { jsonError, requireClubMember } from "@/lib/api";

export async function POST() {
  const { response } = await requireClubMember();
  if (response) return response;

  return jsonError(
    "VLY membership photos are managed by admins during registration.",
    403,
  );
}

export async function DELETE() {
  const { response } = await requireClubMember();
  if (response) return response;

  return jsonError(
    "VLY membership photos are managed by admins during registration.",
    403,
  );
}
