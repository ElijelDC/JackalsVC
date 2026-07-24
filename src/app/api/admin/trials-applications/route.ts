import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { serializeTrialsApplication } from "@/lib/trials-application-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const applications = await prisma.trialsApplication.findMany({
    where:
      status === "NEW" || status === "REVIEWED" || status === "DISMISSED"
        ? { status }
        : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    applications: applications.map(serializeTrialsApplication),
  });
}
