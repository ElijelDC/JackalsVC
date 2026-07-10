import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { getReclubWatchReferenceCodes } from "@/lib/reclub-config";
import { syncReclubClubUpcomingActivities, syncTrackedReclubMeets } from "@/lib/reclub-sync";

async function handle(request: Request) {
  if (!(await authorizeCronRequest(request))) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const [clubSync, trackedResults] = await Promise.all([
      syncReclubClubUpcomingActivities({ notifyMembers: false }),
      syncTrackedReclubMeets({
        extraCodes: getReclubWatchReferenceCodes(),
        notifyMembers: false,
      }),
    ]);

    return NextResponse.json({
      club: clubSync,
      tracked: {
        synced: trackedResults.length,
        results: trackedResults,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Reclub meets";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
