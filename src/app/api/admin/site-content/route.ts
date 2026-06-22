import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const upsertSchema = z.object({
  key: z
    .string()
    .min(1, "Content key is required")
    .max(120, "Content key is too long")
    .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Invalid content key"),
  value: z.string().max(10000, "Content is too long"),
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const rows = await prisma.siteContent.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ content: Object.fromEntries(rows.map((row) => [row.key, row.value])) });
}

export async function PUT(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    upsertSchema,
  );
  if (parseError || !data) return parseError!;

  const entry = await prisma.siteContent.upsert({
    where: { key: data.key },
    create: { key: data.key, value: data.value },
    update: { value: data.value },
  });

  return NextResponse.json({ entry });
}
