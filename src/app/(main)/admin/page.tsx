import Link from "next/link";
import { AdminActionQueue } from "@/components/admin/AdminActionQueue";
import { AdminOverviewGrid } from "@/components/admin/AdminOverviewGrid";
import { prisma } from "@/lib/prisma";
import { getAdminActionQueue } from "@/lib/admin-action-queue";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AdminSection } from "@/components/admin/AdminShell";
import { SHOP_ENABLED } from "@/lib/features";
import {
  Award,
  Bell,
  Calendar,
  Camera,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Images,
  PartyPopper,
  Shirt,
  Trophy,
  Package,
  ShoppingBag,
  UserCheck,
  Users,
  Volleyball,
} from "lucide-react";

export const metadata = { title: "Admin" };

const SECTIONS = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Accounts and roles",
    icon: Users,
    countKey: "users" as const,
  },
  {
    href: "/admin/roster",
    title: "Registered Members",
    description: "VLY numbers, names, and squads",
    icon: ClipboardList,
    countKey: "roster" as const,
  },
  {
    href: "/admin/kit-orders",
    title: "Kit orders",
    description: "Player kits, jackets, and training tops",
    icon: Shirt,
    countKey: "kitOrders" as const,
  },
  {
    href: "/admin/subscriptions",
    title: "Subscriptions",
    description: "Grant and manage memberships",
    icon: UserCheck,
    countKey: "members" as const,
  },
  {
    href: "/admin/membership",
    title: "Membership plans",
    description: "Pricing and features",
    icon: CreditCard,
    countKey: "plans" as const,
  },
  {
    href: "/admin/training",
    title: "Weekly training",
    description: "Member-only recurring sessions",
    icon: Dumbbell,
    countKey: "training" as const,
  },
  {
    href: "/admin/matches",
    title: "Squad matches",
    description: "League and friendly games per squad",
    icon: Trophy,
    countKey: "matches" as const,
  },
  {
    href: "/admin/fun-sessions",
    title: "Fun sessions",
    description: "Public social sessions",
    icon: PartyPopper,
    countKey: "funSessions" as const,
  },
  {
    href: "/admin/events",
    title: "Calendar events",
    description: "Tournaments, socials & meetings",
    icon: Calendar,
    countKey: "events" as const,
  },
  {
    href: "/admin/reminders",
    title: "Event reminders",
    description: "Member event alerts",
    icon: Bell,
    countKey: "reminders" as const,
  },
  {
    href: "/admin/products",
    title: "Products",
    description: "Shop inventory",
    icon: Package,
    countKey: "products" as const,
  },
  {
    href: "/admin/orders",
    title: "Orders",
    description: "Shop purchases",
    icon: ShoppingBag,
    countKey: "orders" as const,
  },
  {
    href: "/admin/gallery",
    title: "Gallery",
    description: "Photos and highlights",
    icon: Camera,
    countKey: "gallery" as const,
  },
  {
    href: "/admin/tournament-photos",
    title: "Tournament photos",
    description: "Winner shots and linked tournament albums",
    icon: Images,
    countKey: "tournamentPhotos" as const,
  },
  {
    href: "/admin/achievements",
    title: "Achievements",
    description: "Club milestones and titles",
    icon: Award,
    countKey: "achievements" as const,
  },
  {
    href: "/admin/teams",
    title: "Our teams",
    description: "Squads on the teams page",
    icon: Volleyball,
    countKey: "teams" as const,
  },
];

export default async function AdminPage() {
  const actionQueue = await getAdminActionQueue();

  const [
    users,
    plans,
    members,
    roster,
    kitOrders,
    training,
    matches,
    funSessions,
    events,
    reminders,
    products,
    orders,
    gallery,
    tournamentPhotos,
    achievements,
    teams,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.membershipPlan.count(),
    prisma.membership.count(),
    prisma.clubMember.count(),
    prisma.kitOrder.count(),
    prisma.trainingSession.count({
      where: { category: "WEEKLY" },
    }),
    prisma.teamMatch.count(),
    prisma.trainingSession.count({
      where: { category: "FUN" },
    }),
    prisma.event.count(),
    prisma.eventReminder.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.galleryAlbum.count(),
    prisma.tournamentWinnerPhoto.count(),
    prisma.achievement.count(),
    prisma.clubTeam.count(),
  ]);

  const counts = {
    users,
    plans,
    members,
    roster,
    kitOrders,
    training,
    matches,
    funSessions,
    events,
    reminders,
    products,
    orders,
    gallery,
    tournamentPhotos,
    achievements,
    teams,
  };

  return (
    <>
      <AdminActionQueue
        entries={actionQueue.entries}
        totalCount={actionQueue.totalCount}
      />

      <AdminSection
        title="Overview"
        description="Full database management — every table in one place. Changes go live immediately."
      >
      <AdminOverviewGrid>
        {SECTIONS.filter(
          (section) =>
            SHOP_ENABLED ||
            (section.href !== "/admin/products" &&
              section.href !== "/admin/orders"),
        ).map(({ href, title, description, icon: Icon, countKey }) => (
          <Link key={href} href={href}>
            <Card className="h-full p-4 transition-colors hover:border-jackals-red/40 sm:p-6">
              <div className="mb-2 flex h-8 w-8 items-center justify-center bg-jackals-red/15 text-jackals-red-light sm:mb-3 sm:h-10 sm:w-10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <CardTitle className="line-clamp-2 text-sm leading-snug sm:text-lg">
                {title}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2 text-xs sm:mt-2 sm:text-sm">
                {description}
              </CardDescription>
              {countKey ? (
                <p className="mt-2 text-xs font-medium text-jackals-red-light sm:mt-4 sm:text-sm">
                  {counts[countKey]} record{counts[countKey] !== 1 ? "s" : ""} →
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-jackals-red-light sm:mt-4 sm:text-sm">
                  Open →
                </p>
              )}
            </Card>
          </Link>
        ))}
      </AdminOverviewGrid>
    </AdminSection>
    </>
  );
}
