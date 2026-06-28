import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimatedBlock } from "@/components/motion/AnimatedBlock";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { ProfileMatchdaySection } from "@/components/profile/ProfileMatchdaySection";
import { ProfileEmailSection } from "@/components/profile/ProfileEmailSection";
import { ProfileNewsletterSection } from "@/components/profile/ProfileNewsletterSection";
import { ProfilePasswordSection } from "@/components/profile/ProfilePasswordSection";
import {
  formatMembershipStatusLabel,
  isCoachMembershipStatus,
} from "@/lib/membership-status";
import { isSubscribedToEventNewsletter } from "@/lib/event-newsletter-subscription";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Profile | Jackals VC",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const clubMember = await prisma.clubMember.findUnique({
    where: { userId: session.user.id },
  });

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      endDate: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  const eventNewsletterSubscribed = session.user.email
    ? await isSubscribedToEventNewsletter(session.user.email)
    : false;

  const displayName = clubMember?.name ?? session.user.name ?? "Member";
  const isCoach =
    clubMember?.rosterRole === "COACH" ||
    (membership?.status ? isCoachMembershipStatus(membership.status) : false);
  const membershipStatusLabel = isCoach
    ? "Coach"
    : membership
      ? formatMembershipStatusLabel(membership.status)
      : null;

  return (
    <PageContainer>
      <PageHeader
        title="Your profile"
        description={
          isCoach
            ? "Your coach account on the Jackals roster"
            : "Your club member details from the Jackals roster"
        }
      />

      <AnimatedBlock delay={80}>
        <Card className="max-w-lg">
          <div className="mb-6 flex items-center gap-4">
            <MemberAvatar
              name={displayName}
              imageUrl={clubMember?.profileImageUrl}
              size="xl"
            />
            <div>
              <p className="font-display text-xl font-bold text-white">
                {displayName}
              </p>
              <p className="text-sm text-zinc-500">
                {clubMember
                  ? "Club profile photo and name are managed by admins."
                  : "Link your VLY roster entry to unlock club profile details."}
              </p>
            </div>
          </div>
          <dl className="space-y-5">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Name
              </dt>
              <dd className="mt-1 text-lg font-semibold text-white">
                {displayName}
              </dd>
            </div>

            {clubMember && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  VLY number
                </dt>
                <dd className="mt-1 font-mono text-base text-jackals-red-light">
                  {clubMember.vlyNumber}
                </dd>
              </div>
            )}

            {membershipStatusLabel && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Account type
                </dt>
                <dd className="mt-1">
                  <Badge
                    className={
                      isCoach
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                        : "border-green-500/30 bg-green-500/10 text-green-400"
                    }
                  >
                    {membershipStatusLabel}
                  </Badge>
                </dd>
              </div>
            )}

            <ProfileEmailSection initialEmail={session.user.email ?? ""} />
            <ProfilePasswordSection />
          </dl>

          {clubMember && (
            <ProfileMatchdaySection
              initialVlyPhotoUrl={clubMember.vlyMembershipPhotoUrl}
              initialPlayerNumber={clubMember.playerNumber}
              isCoach={isCoach}
            />
          )}

          <ProfileNewsletterSection
            initialSubscribed={eventNewsletterSubscribed}
          />
        </Card>
      </AnimatedBlock>
    </PageContainer>
  );
}
