import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export const metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader
        title="About Us"
        description="Jackals Volleyball Club — train hard and grow together on and off the court."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Who we are</CardTitle>
          <CardDescription className="mt-3 leading-relaxed">
            Jackals VC is a community volleyball club built around open sessions,
            competitive training, and a welcoming pack mentality. Whether you are
            picking up a ball for the first time or chasing league titles, there
            is a place for you here.
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>What we offer</CardTitle>
          <CardDescription className="mt-3 leading-relaxed">
            High standard weekly training for league members, fun sessions and
            tournaments open to everyone, skills clinics and a calendar packed
            with events throughout the season! We strive for competitiveness and
            good vibes for our teams.
          </CardDescription>
        </Card>
        <Card className="md:col-span-2">
          <CardTitle>Our values</CardTitle>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-zinc-500">
            <p>
              We believe in showing up for each other — on court and off. Respect,
              effort, and team spirit come first. Every session is a chance to
              improve, compete, and belong.
            </p>
            <p>
              Volleyball is a team sport in every sense, and we carry that into
              how we run the club. We celebrate the big wins, but we also value
              the small stuff: turning up on time, cheering from the sideline,
              helping a teammate nail a new skill, and making newcomers feel
              welcome from their first session.
            </p>
            <p>
              We hold ourselves to a high standard without losing the fun. Push
              hard in training, play fair in matches, and leave the court knowing
              you gave your best. Good vibes are not optional — they are part of
              what makes Jackals VC feel like a pack, not just a roster.
            </p>
            <p>
              Above all, we are a club built on community. Whether you are here
              for league competition, social play, or somewhere in between, you
              are part of something bigger than one session or one result. That is
              what we stand for.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
