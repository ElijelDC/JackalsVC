import { Membership202627Showcase } from "@/components/membership/Membership202627Showcase";
import {
  buildMembershipLeagueTiers,
  buildMembershipPublicPaymentOptions,
  getDefaultMembershipLeagueTiers,
  getDefaultMembershipPublicPaymentOptions,
} from "@/lib/membership-config";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 Membership",
  description:
    "Jackals VC 2026/27 season membership — fees by league and what's included. National League squads.",
  path: "/membership/2026-27",
});

export default async function Membership202627Page() {
  const activePlans = await prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: [{ price: "desc" }, { name: "asc" }],
    select: {
      name: true,
      price: true,
      durationMonths: true,
      installment1Eur: true,
      installment2Eur: true,
      installment3Eur: true,
    },
  });

  const paymentOptions =
    activePlans.length > 0
      ? buildMembershipPublicPaymentOptions(activePlans)
      : getDefaultMembershipPublicPaymentOptions();

  const leagueTiers =
    activePlans.length > 0
      ? buildMembershipLeagueTiers(activePlans)
      : getDefaultMembershipLeagueTiers();

  return (
    <Membership202627Showcase
      leagueTiers={leagueTiers}
      paymentOptions={paymentOptions}
    />
  );
}
