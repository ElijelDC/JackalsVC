import { ContactForm } from "@/components/contact/ContactForm";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { CONTACT_EMAIL } from "@/lib/contact";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";

export const metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Contact Us"
        description="Questions about training, membership, or events? Reach out — we would love to hear from you."
      />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardTitle>Email</CardTitle>
          <CardDescription className="mt-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-jackals-red-light transition-colors hover:text-jackals-red"
            >
              {CONTACT_EMAIL}
            </a>
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Send us a message</CardTitle>
          <div className="mt-4">
            <ContactForm />
          </div>
        </Card>
        <Card>
          <CardTitle>Social</CardTitle>
          <CardDescription className="mt-3">
            Follow us on{" "}
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-jackals-red-light transition-colors hover:text-jackals-red"
            >
              Instagram @jackalsvolleyball
            </a>{" "}
            for session updates, match highlights, and club news.
          </CardDescription>
        </Card>
      </div>
    </PageContainer>
  );
}
