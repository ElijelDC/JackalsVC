import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { queryAdminActionQueue } from "@/lib/admin-action-queue";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const queue = await queryAdminActionQueue();
  return NextResponse.json(queue);
}
