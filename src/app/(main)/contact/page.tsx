import { ContactShowcase } from "@/components/contact/ContactShowcase";
import { CONTACT_EMAIL } from "@/lib/contact";
import { pageMetadata, SEO_COPY } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: `${SEO_COPY.contactHero} Email ${CONTACT_EMAIL} or visit jackalsvolleyball.com.`,
  path: "/contact",
});

export default function ContactPage() {
  return <ContactShowcase />;
}
