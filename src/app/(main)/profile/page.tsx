import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimatedBlock } from "@/components/motion/AnimatedBlock";
import { MemberAvatar } from "@/components/member/MemberAvatar";
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

  const displayName = clubMember?.name ?? session.user.name ?? "Member";

  return (
    <PageContainer>
      <PageHeader
        title="Your profile"
        description="Your club member details from the Jackals roster"
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
            <p className="font-display text-xl font-bold text-white">{displayName}</p>
            <p className="text-sm text-zinc-500">
              {clubMember
                ? "Club profile photo is managed by admins."
                : "Link your VLY roster entry to unlock club profile details."}
            </p>
          </div>
        </div>
        <dl className="space-y-5">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Name
            </dt>
            <dd className="mt-1 text-lg font-semibold text-white">{displayName}</dd>
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

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Email
            </dt>
            <dd className="mt-1 text-base text-zinc-300">{session.user.email}</dd>
          </div>
        </dl>
      </Card>
      </AnimatedBlock>
    </PageContainer>
  );
}
