import { redirect } from "next/navigation";

export default async function TrainingAttendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/training/${id}`);
}
