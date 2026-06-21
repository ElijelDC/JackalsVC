import {
  deleteTrainingSession,
  updateTrainingSession,
} from "@/lib/admin-training-routes";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return updateTrainingSession(request, id, SESSION_CATEGORIES.FUN);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return deleteTrainingSession(id, SESSION_CATEGORIES.FUN);
}
