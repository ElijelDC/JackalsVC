import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
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

      <Card className="max-w-lg">
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
    </PageContainer>
  );
}
