import { AboutShowcase } from "@/components/about/AboutShowcase";
import { pageMetadata, SEO_COPY } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Us",
  description: `${SEO_COPY.aboutHero} Learn how to join, where we train, and what makes Jackals Volleyball Club welcoming for every level.`,
  path: "/about",
});

export default function AboutPage() {
  return <AboutShowcase />;
}
