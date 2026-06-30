import Link from "next/link";
import { ShowcaseCard, ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT_EMAIL } from "@/lib/contact";
import { EditableText } from "@/components/site-edit/EditableText";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";

function ContactLink({
  href,
  label,
  value,
  description,
  external,
}: {
  href: string;
  label: string;
  value: string;
  description: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group block border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/10"
    >
      <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 transition-colors group-hover:text-jackals-red-light">
        {label}
      </span>
      <span className="mt-1 block text-base font-medium text-white transition-colors group-hover:text-jackals-red-light">
        {value}
      </span>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
    </a>
  );
}

export function ContactShowcase() {
  return (
    <>
      <ShowcaseHero
        title="Contact"
        highlight="Us"
        description={
          <EditableText
            contentKey="contact.hero.description"
            fallback="Questions about training or events? Reach out — we would love to hear from you."
            label="Contact hero description"
            multiline
          />
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <StaggerIn className="space-y-6 lg:col-span-2" stagger={100}>
            <ShowcaseCard title="Get in touch">
              <div className="space-y-4">
                <ContactLink
                  href={`mailto:${CONTACT_EMAIL}`}
                  label="Email"
                  value={CONTACT_EMAIL}
                  description="Best for training and event enquiries."
                />
                <ContactLink
                  href={INSTAGRAM_PROFILE_URL}
                  label="Instagram"
                  value="@jackalsvolleyball"
                  description="Session updates, match highlights, and club news."
                  external
                />
              </div>
            </ShowcaseCard>

            <ShowcaseCard title="What to expect">
              <p>
                We read every message and aim to reply within a few days. For
                urgent session or event questions, Instagram is often the fastest
                way to reach us.
              </p>
            </ShowcaseCard>
          </StaggerIn>

          <AnimateIn variant="fade-up" className="lg:col-span-3">
            <ShowcaseCard title="Send a message">
              <p className="mb-6">
                Tell us a little about what you need — whether you are new to
                the club or curious about an upcoming session.
              </p>
              <ContactForm />
            </ShowcaseCard>
          </AnimateIn>
        </div>

        <AnimateIn className="mt-16 sm:mt-20">
          <ShowcaseCtaBand
            title="New to Jackals VC?"
            description="Browse open sessions and events to see what is coming up before you get in touch."
          >
            <Link href="/events" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                What&apos;s on?
              </Button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                About us
              </Button>
            </Link>
          </ShowcaseCtaBand>
        </AnimateIn>
      </div>
    </>
  );
}
