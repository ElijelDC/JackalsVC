import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { listTrialsApplications } from "@/lib/trials-applications";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const applications = await listTrialsApplications();
  return NextResponse.json({ applications });
}
