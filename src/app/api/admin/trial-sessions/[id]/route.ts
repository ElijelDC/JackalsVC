import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  listTrialSessionSignupsForAdmin,
  serializeTrialSession,
  slugifyTrialSessionTitle,
} from "@/lib/trial-sessions";
import {
  deriveTrialSessionReminderStats,
} from "@/lib/trial-session-reminders";
import { parseDatetimeLocalAsClubTime } from "@/lib/datetime-form";
import { trialSessionPublicPath } from "@/lib/trial-session-types";
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
    startDate: parseDatetimeLocalAsClubTime(data.startDate),
    endDate: data.endDate ? parseDatetimeLocalAsClubTime(data.endDate) : null,
    location: data.location?.trim() || null,
    locationUrl: data.locationUrl?.trim() || null,
    coachName: data.coachName?.trim() || null,
    paymentUrl: data.paymentUrl?.trim() || null,
    reclubUsername: data.reclubUsername?.trim() || null,
    sessionFee: data.sessionFee ?? null,
    active: data.active ?? true,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const session = await prisma.trialSession.findUnique({ where: { id } });

  if (!session) {
    return jsonError("Session not found", 404);
  }

  const signups = await listTrialSessionSignupsForAdmin(id);
  const reminderStats = deriveTrialSessionReminderStats(
    signups.filter((signup) => signup.status === "APPROVED"),
    session.startDate,
  );

  return NextResponse.json({
    session: serializeTrialSession(session),
    signups,
    publicPath: trialSessionPublicPath(session.slug),
    reminderStats,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.trialSession.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Session not found", 404);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    trialSessionSchema,
  );
  if (parseError || !data) return parseError!;

  let slug = existing.slug;
  if (data.slug) {
    slug = slugifyTrialSessionTitle(data.slug);
    if (slug !== existing.slug) {
      const slugTaken = await prisma.trialSession.findUnique({ where: { slug } });
      if (slugTaken) {
        return jsonError("That link slug is already in use. Choose another.", 409);
      }
    }
  }

  const session = await prisma.trialSession.update({
    where: { id },
    data: {
      slug,
      ...toTrialSessionData(data),
    },
  });

  return NextResponse.json({ session: serializeTrialSession(session) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.trialSession.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Session not found", 404);
  }

  await prisma.trialSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
