import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { removeTrialSessionSignup } from "@/lib/trial-sessions";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; signupId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, signupId } = await params;
  const result = await removeTrialSessionSignup(id, signupId);

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ success: true });
}
