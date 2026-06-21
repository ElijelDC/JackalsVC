import { NextResponse } from "next/server";
import {
  createTrainingSession,
  deleteTrainingSession,
  getTrainingSessionsResponse,
  updateTrainingSession,
} from "@/lib/admin-training-routes";
import { jsonError } from "@/lib/api";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

export async function GET() {
  return getTrainingSessionsResponse(SESSION_CATEGORIES.WEEKLY);
}

export async function POST(request: Request) {
  return createTrainingSession(request, SESSION_CATEGORIES.WEEKLY);
}
