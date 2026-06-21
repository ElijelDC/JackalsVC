import { NextResponse } from "next/server";
import { parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { achievementSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ achievements });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    achievementSchema,
  );
  if (parseError || !data) return parseError!;

  const achievement = await prisma.achievement.create({
    data: {
      title: data.title,
      season: data.season,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      sortOrder: data.sortOrder,
      type: data.type,
    },
  });
  return NextResponse.json({ achievement }, { status: 201 });
}
