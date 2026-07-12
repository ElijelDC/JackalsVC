import { requireCoachPage } from "@/lib/coach-auth";
import { CoachShell } from "@/components/coach/CoachShell";
import { adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata("Coach");

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { coach } = await requireCoachPage();

  return <CoachShell teamName={coach.teamName}>{children}</CoachShell>;
}
