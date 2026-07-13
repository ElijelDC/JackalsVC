import { CoachingRecruitmentShowcase } from "@/components/coaching/CoachingRecruitmentShowcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Coach With Us",
  description:
    "Jackals Volleyball Club is recruiting passionate coaches in Dublin — paid roles depending on experience, National League squads, and a welcoming club culture. Express your interest today.",
  path: "/coaching",
});

export default function CoachingRecruitmentPage() {
  return <CoachingRecruitmentShowcase />;
}
