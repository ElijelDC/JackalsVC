import { redirectToSessionAttendance } from "@/lib/session-attend";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

export default async function TrainingAttendPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;
  await redirectToSessionAttendance(id, SESSION_CATEGORIES.WEEKLY, date);
}
