import { SponsorPresentationPreview } from "@/components/sponsors/SponsorPresentationPreview";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sponsor Presentation",
  path: "/sponsors/presentation",
  noIndex: true,
});

export default function SponsorPresentationPage() {
  return <SponsorPresentationPreview />;
}
