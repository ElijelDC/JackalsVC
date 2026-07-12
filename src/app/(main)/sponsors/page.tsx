import { SponsorsShowcase } from "@/components/sponsors/SponsorsShowcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "For Sponsors",
  description:
    "Partner with Jackals Volleyball Club in Dublin — brand visibility, kit sponsorship, and support for Irish National League volleyball.",
  path: "/sponsors",
});

export default function SponsorsPage() {
  return <SponsorsShowcase />;
}
