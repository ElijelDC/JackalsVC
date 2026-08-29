import { TrialsRecruitmentShowcase } from "@/components/trials/TrialsRecruitmentShowcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Trials",
  description:
    "Jackals Volleyball Club August 2026 trials — apply for Men's Division 2, Men's Division 3, and Women's Division 3 Irish National League squads in Dublin.",
  path: "/trials",
});

export default function TrialsRecruitmentPage() {
  return <TrialsRecruitmentShowcase />;
}
