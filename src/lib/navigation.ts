import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Calendar,
  Camera,
  Dumbbell,
  Home,
  Mail,
  ShoppingBag,
  Sparkles,
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
    href: "/whats-on",
    label: "What's On?",
    icon: Sparkles,
    description:
      "Fun sessions, tournaments, and skills clinics open to everyone.",
  },
  {
    href: "/training",
    label: "Training",
    icon: Dumbbell,
    description:
      "Weekly sessions for all skill levels, from beginners to competitive players.",
    requiresAuth: true,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    description:
      "Stay on top of tournaments, skills clinics, and club meetings — add them to your calendar or save club reminders when signed in.",
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
  "/whats-on",
  "/training",
  "/calendar",
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
  if (href === "/whats-on" && pathname.startsWith("/fun-sessions")) return true;
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
    (item) => !PRIMARY_NAV_HREFS.has(item.href),
  );
  return [...secondaryNav, ...INFO_NAV_ITEMS];
}

export function visibleFeatureItems(isLoggedIn: boolean) {
  return visibleNavItems(isLoggedIn).filter((item) => item.href !== "/");
}
