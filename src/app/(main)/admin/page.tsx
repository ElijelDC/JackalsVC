import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AdminSection } from "@/components/admin/AdminShell";
import { SHOP_ENABLED } from "@/lib/features";
import {
  Award,
  Bell,
  Calendar,
  Camera,
  CreditCard,
  Dumbbell,
  PartyPopper,
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
    href: "/admin/membership",
    title: "Membership plans",
    description: "Pricing and features",
    icon: CreditCard,
    countKey: "plans" as const,
  },
  {
    href: "/admin/members",
    title: "Member subscriptions",
    description: "Active memberships",
    icon: UserCheck,
    countKey: "members" as const,
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
  const [
    users,
    plans,
    members,
    training,
    matches,
    funSessions,
    events,
    reminders,
    products,
    orders,
    gallery,
    achievements,
    teams,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.membershipPlan.count(),
    prisma.membership.count(),
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
    prisma.achievement.count(),
    prisma.clubTeam.count(),
  ]);

  const counts = {
    users,
    plans,
    members,
    training,
    matches,
    funSessions,
    events,
    reminders,
    products,
    orders,
    gallery,
    achievements,
    teams,
  };

  return (
    <AdminSection
      title="Overview"
      description="Full database management — every table in one place. Changes go live immediately."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.filter(
          (section) =>
            SHOP_ENABLED ||
            (section.href !== "/admin/products" &&
              section.href !== "/admin/orders"),
        ).map(({ href, title, description, icon: Icon, countKey }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-jackals-red/40">
              <div className="mb-3 flex h-10 w-10 items-center justify-center bg-jackals-red/15 text-jackals-red-light">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-2">{description}</CardDescription>
              <p className="mt-4 text-sm font-medium text-jackals-red-light">
                {counts[countKey]} record{counts[countKey] !== 1 ? "s" : ""} →
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AdminSection>
  );
}
