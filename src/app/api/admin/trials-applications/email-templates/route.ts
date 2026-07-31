import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { getSiteContentMap } from "@/lib/site-content";
import {
  buildTrialsEmailTemplateKeys,
  isTrialsTeamOption,
  loadTrialsEmailTemplates,
} from "@/lib/trials-email-templates";
import { prisma } from "@/lib/prisma";

const saveTemplateSchema = z.object({
  team: z.string().min(1),
  subject: z.string().min(3).max(200),
  body: z.string().min(1).max(10000),
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const map = await getSiteContentMap();
  return NextResponse.json({ templates: loadTrialsEmailTemplates(map) });
}

export async function PUT(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    saveTemplateSchema,
  );
  if (parseError || !data) return parseError!;

  if (!isTrialsTeamOption(data.team)) {
    return jsonError("Select a valid tryout team.", 400);
  }

  const entries = buildTrialsEmailTemplateKeys(data.team, {
    subject: data.subject.trim(),
    body: data.body,
  });

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.siteContent.upsert({
        where: { key: entry.key },
        create: entry,
        update: { value: entry.value },
      }),
    ),
  );

  const map = await getSiteContentMap();
  return NextResponse.json({
    templates: loadTrialsEmailTemplates(map),
  });
}
