import { OurSponsorsPage } from "@/components/sponsors/OurSponsorsPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Our Sponsors",
  description:
    "Meet the businesses and organisations who support Jackals Volleyball Club in Dublin — and learn how to become a partner.",
  path: "/sponsors/partners",
});

export default function OurSponsorsRoute() {
  return <OurSponsorsPage />;
}
