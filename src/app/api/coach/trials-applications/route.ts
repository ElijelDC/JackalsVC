import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";
import { listTrialsApplications } from "@/lib/trials-applications";

export async function GET() {
  const { response } = await requireCoach();
  if (response) return response;

  const applications = await listTrialsApplications();
  return NextResponse.json({ applications });
}
