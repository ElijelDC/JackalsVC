import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  Dumbbell,
  Home,
  LayoutDashboard,
  Mail,
  ShoppingBag,
  Trophy,
  Users,
  Volleyball,
} from "lucide-react";
import { SHOP_ENABLED } from "@/lib/features";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requiresAuth?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDays,
    description:
      "Fun sessions, tournaments, and skills clinics — browse by category or calendar.",
  },
  {
    href: "/training",
    label: "Trainings",
    icon: Dumbbell,
    description:
      "Sign up for your squad's weekly training sessions throughout the month.",
    requiresAuth: true,
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Trophy,
    description:
      "Your squad's league and friendly matches — warm-up and kick-off times.",
    requiresAuth: true,
  },
  {
    href: "/membership",
    label: "Membership",
    icon: Users,
    description:
      "Flexible plans to suit your schedule. Join the Jackals family today.",
    requiresAuth: true,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Your membership, payments, and event sign-ups.",
    requiresAuth: true,
  },
  {
    href: "/gallery",
    label: "Gallery",
    icon: Camera,
    description:
      "Relive match highlights, training moments, and club socials.",
  },
  {
    href: "/shop",
    label: "Shop",
    icon: ShoppingBag,
    description:
      "Official jerseys, kit, and merchandise — show your club colours.",
  },
];

const PRIMARY_NAV_HREFS = new Set([
  "/",
  "/events",
  "/training",
  "/matches",
  "/membership",
]);

export const INFO_NAV_ITEMS: NavItem[] = [
  {
    href: "/teams",
    label: "Our Teams",
    icon: Volleyball,
    description: "Meet the squads — men's, women's, and development teams.",
  },
  {
    href: "/achievements",
    label: "Club Achievements",
    icon: Award,
    description: "Tournament results, league titles, and club milestones.",
  },
  {
    href: "/about",
    label: "About Us",
    icon: BookOpen,
    description: "Our story, values, and what makes Jackals VC home.",
  },
  {
    href: "/contact",
    label: "Contact Us",
    icon: Mail,
    description: "Get in touch — questions, membership, or training enquiries.",
  },
];

export function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/events" && pathname.startsWith("/fun-sessions")) return true;
  if (href === "/events" && pathname === "/whats-on") return true;
  if (href === "/events" && pathname === "/calendar") return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function isInfoNavActive(pathname: string) {
  const moreHrefs = [
    ...NAV_ITEMS.filter((item) => !PRIMARY_NAV_HREFS.has(item.href)).map(
      (item) => item.href,
    ),
    ...INFO_NAV_ITEMS.map((item) => item.href),
  ];
  return moreHrefs.some((href) => isNavItemActive(pathname, href));
}

export function visibleNavItems(isLoggedIn: boolean) {
  return NAV_ITEMS.filter(
    (item) =>
      (!item.requiresAuth || isLoggedIn) &&
      (SHOP_ENABLED || item.href !== "/shop"),
  );
}

export function visiblePrimaryNavItems(isLoggedIn: boolean) {
  return visibleNavItems(isLoggedIn).filter((item) =>
    PRIMARY_NAV_HREFS.has(item.href),
  );
}

export function visibleMoreNavItems(isLoggedIn: boolean) {
  const secondaryNav = visibleNavItems(isLoggedIn).filter(
    (item) =>
      !PRIMARY_NAV_HREFS.has(item.href) && item.href !== "/dashboard",
  );
  return [...secondaryNav, ...INFO_NAV_ITEMS];
}

export function visibleFeatureItems(isLoggedIn: boolean) {
  return visibleNavItems(isLoggedIn).filter((item) => item.href !== "/");
}
