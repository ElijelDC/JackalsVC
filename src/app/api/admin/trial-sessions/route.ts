import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  createUniqueTrialSessionSlug,
  listTrialSessions,
  serializeTrialSession,
  slugifyTrialSessionTitle,
} from "@/lib/trial-sessions";
import { trialSessionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function toTrialSessionData(data: {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  locationUrl?: string;
  coachName?: string;
  paymentUrl?: string;
  reclubUsername?: string;
  sessionFee?: number;
  active?: boolean;
}) {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || null,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    location: data.location?.trim() || null,
    locationUrl: data.locationUrl?.trim() || null,
    coachName: data.coachName?.trim() || null,
    paymentUrl: data.paymentUrl?.trim() || null,
    reclubUsername: data.reclubUsername?.trim() || null,
    sessionFee: data.sessionFee ?? null,
    active: data.active ?? true,
  };
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const sessions = await listTrialSessions();
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    trialSessionSchema,
  );
  if (parseError || !data) return parseError!;

  const slug = data.slug
    ? slugifyTrialSessionTitle(data.slug)
    : await createUniqueTrialSessionSlug(data.title);

  const existingSlug = await prisma.trialSession.findUnique({ where: { slug } });
  if (existingSlug) {
    return jsonError("That link slug is already in use. Choose another.", 409);
  }

  const session = await prisma.trialSession.create({
    data: {
      slug,
      ...toTrialSessionData(data),
    },
  });

  return NextResponse.json(
    { session: serializeTrialSession(session) },
    { status: 201 },
  );
}
