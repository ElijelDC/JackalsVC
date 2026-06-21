import {
  createTrainingSession,
  getTrainingSessionsResponse,
} from "@/lib/admin-training-routes";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

export async function GET() {
  return getTrainingSessionsResponse(SESSION_CATEGORIES.FUN);
}

export async function POST(request: Request) {
  return createTrainingSession(request, SESSION_CATEGORIES.FUN);
}
