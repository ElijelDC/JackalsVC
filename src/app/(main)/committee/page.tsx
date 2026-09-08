import { CommitteeRolesShowcase } from "@/components/committee/CommitteeRolesShowcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Committee Roles",
  description:
    "Jackals Volleyball Club committee roles for 2026/27 — browse responsibilities and share your top three preferences.",
  path: "/committee",
  noIndex: true,
});

export default function CommitteeRolesPage() {
  return <CommitteeRolesShowcase />;
}
