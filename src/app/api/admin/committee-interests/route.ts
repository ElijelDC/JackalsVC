import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { serializeCommitteeInterest } from "@/lib/committee-roles-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const interests = await prisma.committeeInterest.findMany({
    where:
      status === "NEW" || status === "REVIEWED" || status === "DISMISSED"
        ? { status }
        : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    interests: interests.map(serializeCommitteeInterest),
  });
}
