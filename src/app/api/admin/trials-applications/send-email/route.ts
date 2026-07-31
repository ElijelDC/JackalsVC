import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import { getSiteContentMap } from "@/lib/site-content";
import { sendTrialsApplicantEmail } from "@/lib/send-trials-applicant-email";
import { listTrialsApplications } from "@/lib/trials-applications";
import {
  filterTrialsApplications,
  type TrialsApplicationsFilter,
} from "@/lib/trials-applications-filter";
import {
  buildTrialsEmailTemplateKeys,
  isTrialsTeamOption,
  loadTrialsEmailTemplates,
} from "@/lib/trials-email-templates";
import { prisma } from "@/lib/prisma";

const sendEmailSchema = z.object({
  team: z.string().min(1),
  subject: z.string().min(3).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  saveTemplate: z.boolean().optional(),
  filters: z.object({
    status: z.enum(["ALL", "NEW", "REVIEWED", "DISMISSED"]),
    team: z.string(),
    position: z.string(),
    search: z.string(),
  }),
  applicationIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  if (!isEmailConfigured()) {
    return jsonError("Email delivery is not configured", 503);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    sendEmailSchema,
  );
  if (parseError || !data) return parseError!;

  if (!isTrialsTeamOption(data.team)) {
    return jsonError("Select a valid tryout team.", 400);
  }

  const map = await getSiteContentMap();
  const templates = loadTrialsEmailTemplates(map);
  const template = templates[data.team];
  const subject = data.subject?.trim() || template.subject;
  const body = data.body ?? template.body;

  if (data.saveTemplate) {
    const entries = buildTrialsEmailTemplateKeys(data.team, { subject, body });
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.siteContent.upsert({
          where: { key: entry.key },
          create: entry,
          update: { value: entry.value },
        }),
      ),
    );
  }

  const filters: TrialsApplicationsFilter = {
    status: data.filters.status,
    team: data.filters.team as TrialsApplicationsFilter["team"],
    position: data.filters.position as TrialsApplicationsFilter["position"],
    search: data.filters.search,
  };

  let recipients = filterTrialsApplications(
    await listTrialsApplications(),
    filters,
  ).filter((application) => application.tryingOutFor === data.team);

  if (data.applicationIds?.length) {
    const idSet = new Set(data.applicationIds);
    recipients = recipients.filter((application) => idSet.has(application.id));
  }

  if (recipients.length === 0) {
    return jsonError("No matching applicants to email for this team.", 400);
  }

  let delivered = 0;
  let failed = 0;

  for (const application of recipients) {
    const result = await sendTrialsApplicantEmail(application, template, {
      subjectOverride: subject,
      bodyOverride: body,
    });
    if (result.delivered) {
      delivered += 1;
    } else {
      failed += 1;
    }
  }

  if (delivered === 0) {
    return jsonError(
      "Email could not be sent. Check SMTP settings and try again.",
      503,
    );
  }

  return NextResponse.json({
    attempted: recipients.length,
    delivered,
    failed,
  });
}
