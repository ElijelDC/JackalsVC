import { requireCoachPage } from "@/lib/coach-auth";
import { adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata("Coach");

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCoachPage();
  return children;
}
